import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  ENTERPRISE_REPOSITORY_PORT,
  type EnterpriseRepositoryPort,
} from '../domain/ports/enterprise-repository.port';
import {
  PRODUCT_REPOSITORY_PORT,
  type ProductRepositoryPort,
} from '../../product/domain/ports/product-repository.port';
import { PaymentProcessorService } from '../../payment-processor/application/services/payment-processor.service';
import { normalizePhoneToR4 } from '@/shared/utils/phone';
import type { Disbursement } from '../domain/disbursement';
import type { Purchase } from '../domain/purchase';

export interface VueltoRequestDto {
  /** ID del usuario de finanzas que ejecuta (viene de la sesion) */
  financeUserId: string;
  /** Nombre del usuario de finanzas */
  financeUserName: string;
}

export type VueltoExecuteResult =
  | {
      status: 'disbursed';
      request: Awaited<ReturnType<EnterpriseRepositoryPort['findRequestById']>>;
      disbursement: Disbursement;
      reference: string;
    }
  | { status: 'failed'; code: string; message: string };

/**
 * Orquesta el desembolso via Vuelto R4 (respuesta inmediata, sin polling).
 */
@Injectable()
export class ManageVueltoUseCase {
  constructor(
    @Inject(ENTERPRISE_REPOSITORY_PORT)
    private readonly repository: EnterpriseRepositoryPort,
    @Inject(PRODUCT_REPOSITORY_PORT)
    private readonly productRepository: ProductRepositoryPort,
    private readonly paymentProcessorService: PaymentProcessorService,
  ) {}

  /**
   * Procesa el desembolso de una solicitud via Vuelto R4.
   * Este método no requiere verificación posterior.
   * @param requestId ID de la solicitud.
   * @param dto Datos del usuario de finanzas que ejecuta.
   * @returns Resultado del proceso de vuelto.
   */
  async execute(
    requestId: string,
    dto: VueltoRequestDto,
  ): Promise<VueltoExecuteResult> {
    const request = await this.repository.findRequestById(requestId);
    if (!request) throw new NotFoundException('Solicitud no encontrada.');

    if (
      request.status !== 'approved' &&
      request.status !== 'company_approved'
    ) {
      throw new BadRequestException(
        'La solicitud debe estar aprobada (por la empresa o finanzas) para desembolsar.',
      );
    }

    // Verificar que no exista ya un desembolso exitoso o pendiente
    const existing =
      await this.repository.findDisbursementByLoanRequestId(requestId);
    if (existing && existing.status === 'success') {
      throw new BadRequestException(
        'Esta solicitud ya tiene un desembolso exitoso.',
      );
    }
    if (existing && existing.status === 'pending') {
      throw new BadRequestException(
        'Esta solicitud tiene un desembolso pendiente en proceso.',
      );
    }

    // Obtener el producto para leer la configuración de r4_vuelto
    let configuredAmountUsd: number | null = null;
    if (request.productId) {
      const product = await this.productRepository.findById(request.productId);
      if (product?.actions) {
        const r4VueltoAction = product.actions.find(
          (a: {
            type: string;
            active: boolean;
            config?: { amountUsd?: number };
          }) => a.type === 'r4_vuelto' && a.active && a.config?.amountUsd,
        );
        if (r4VueltoAction) {
          configuredAmountUsd = Number(r4VueltoAction.config.amountUsd);
        }
      }
    }

    // Buscar perfil del colaborador
    const profile = await this.repository.findCollaboratorById(
      request.collaboratorId,
    );
    if (!profile) {
      throw new BadRequestException(
        'No se encontro el perfil del colaborador.',
      );
    }

    // Buscar cuenta bancaria primaria del colaborador
    const bankAccounts =
      await this.repository.findBankAccountsByPersonProfileId(profile.id);
    const primaryAccount =
      bankAccounts.find((acc) => acc.isPrimary) || bankAccounts[0];
    if (!primaryAccount) {
      throw new BadRequestException(
        'El colaborador no tiene cuenta bancaria registrada.',
      );
    }

    // Obtener tasa de cambio BCV
    let exchangeRate: number;

    const dbRate = await this.paymentProcessorService.getLastExchangeRate();
    if (dbRate && dbRate.bolivaresPerUsd) {
      exchangeRate = Number(dbRate.bolivaresPerUsd);
    } else {
      const today = new Date().toISOString().split('T')[0];

      const rateResponse = await this.paymentProcessorService.getExchangeRate({
        companyAccountId: 'GLOBAL_R4_FALLBACK',
        date: today,
        currency: 'USD',
      });

      if (!rateResponse || !rateResponse.exchangeRate) {
        throw new BadRequestException(
          'No se pudo obtener la tasa de cambio BCV para calcular el monto en bolivares.',
        );
      }

      exchangeRate = rateResponse.exchangeRate;
    }

    // Calcular monto en Bs (usar monto configurado en el producto, o el monto de la solicitud como fallback)
    const amountUsd = configuredAmountUsd ?? Number(request.amount);
    const amountBs = Number((amountUsd * exchangeRate).toFixed(2));

    const concept = `Desembolso prestamo: ${request.description || 'Prestamo'}`;

    // Ejecutar Vuelto en R4
    const vueltoResult = (await this.paymentProcessorService.processVueltoR4({
      companyAccountId: 'GLOBAL_R4_FALLBACK',
      TelefonoDestino: normalizePhoneToR4(primaryAccount.phoneNumber),
      Cedula: primaryAccount.documentId,
      Banco: primaryAccount.bankCode,
      Monto: amountBs.toFixed(2),
      Concepto: concept,
    })) as {
      code: string;
      message?: string;
      reference?: string;
      rawResponse?: any;
    };

    // Si el código no es "00", retornar el error sin modificar el estado
    if (vueltoResult.code !== '00') {
      return {
        status: 'failed',
        code: vueltoResult.code,
        message: vueltoResult.message || 'Error en proceso de vuelto',
      };
    }

    // Código "00": desembolso exitoso, guardar y actualizar solicitud
    const disbursement = this.buildDisbursement(
      requestId,
      dto,
      amountUsd,
      amountBs,
      exchangeRate,
      primaryAccount,
      concept,
      vueltoResult.reference || null,
      'success',
      vueltoResult,
    );
    await this.repository.saveDisbursement(disbursement);

    request.status = 'disbursed';
    request.updatedAt = new Date().toISOString();
    await this.repository.saveRequest(request);

    await this.savePurchaseForDisbursement({
      requestId,
      amountUsd,
      amountVes: amountBs,
      exchangeRate,
      disbursementId: disbursement.id,
    });

    return {
      status: 'disbursed',
      request,
      disbursement,
      reference: vueltoResult.reference || '',
    };
  }

  /**
   * Construye un objeto Disbursement con los campos comunes.
   */
  private buildDisbursement(
    requestId: string,
    dto: VueltoRequestDto,
    amountUsd: number,
    amountBs: number,
    exchangeRate: number,
    primaryAccount: {
      bankCode: string;
      accountNumber: string;
      phoneNumber: string;
      documentId: string;
    },
    concept: string,
    bankReference: string | null,
    status: 'success' | 'failed' | 'pending',
    vueltoResult: { rawResponse?: any },
  ): Disbursement {
    return {
      id: randomUUID(),
      loanRequestId: requestId,
      paymentId: randomUUID(),
      financeUserId: dto.financeUserId,
      financeUserName: dto.financeUserName,
      amountUsd,
      amountBs,
      exchangeRate,
      bankCode: primaryAccount.bankCode,
      accountNumber: primaryAccount.accountNumber,
      phoneNumber: primaryAccount.phoneNumber,
      documentId: primaryAccount.documentId,
      concept,
      bankReference,
      bankOperationId: null,
      status,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Crea un Purchase para registrar la compra/orden desembolsada.
   */
  private async savePurchaseForDisbursement(params: {
    requestId: string;
    amountUsd: number;
    amountVes: number;
    exchangeRate: number;
    disbursementId: string;
  }): Promise<void> {
    try {
      const request = await this.repository.findRequestById(params.requestId);
      if (!request) return;

      const profile = await this.repository.findCollaboratorById(
        request.collaboratorId,
      );
      const product = request.productId
        ? await this.productRepository.findById(request.productId)
        : null;

      const now = new Date().toISOString();
      const purchase: Purchase = {
        id: randomUUID(),
        purchaserType: 'collaborator',
        purchaserId: request.collaboratorId,
        purchaserName: request.collaboratorName,
        purchaserEmail: profile?.email ?? null,
        purchaserDocument: profile?.documentId ?? null,
        productId: request.productId,
        productName: product?.name ?? request.description ?? 'Prestamo',
        productSku: product?.sku ?? null,
        marketplaceId: product?.marketplaceId ?? null,
        marketplaceName: null,
        amountUsd: params.amountUsd,
        amountVes: params.amountVes,
        exchangeRate: params.exchangeRate,
        isFinanced: true,
        installments: 6,
        interestRate: product?.interestRate ?? null,
        channel: 'loan_request',
        transactionId: request.id,
        loanRequestId: request.id,
        disbursementId: params.disbursementId,
        status: 'disbursed',
        amountDue: params.amountUsd,
        amountPaid: params.amountUsd,
        dueDate: null,
        delinquencyBucket: 'current',
        overdueSince: null,
        createdAt: now,
        updatedAt: now,
      };

      await this.repository.savePurchase(purchase);
    } catch (err) {
      // No romper el desembolso si falla la creacion del Purchase.

      console.error('Error al guardar Purchase para desembolso:', err);
    }
  }
}
