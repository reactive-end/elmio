import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { LoanRequest } from '../domain/enterprise';
import {
  ENTERPRISE_REPOSITORY_PORT,
  type EnterpriseRepositoryPort,
} from '../domain/ports/enterprise-repository.port';
import { PRODUCT_REPOSITORY_PORT, type ProductRepositoryPort } from '../../product/domain/ports/product-repository.port';
import { PaymentProcessorService } from '../../payment-processor/application/services/payment-processor.service';

/**
 * Gestiona la resolucion de solicitudes de prestamo.
 */
@Injectable()
export class ManageLoanRequestsUseCase {
  constructor(
    @Inject(ENTERPRISE_REPOSITORY_PORT)
    private readonly repository: EnterpriseRepositoryPort,
    @Inject(PRODUCT_REPOSITORY_PORT)
    private readonly productRepository: ProductRepositoryPort,
    private readonly paymentProcessorService: PaymentProcessorService,
  ) {}

  /**
   * Lista solicitudes de una empresa.
   * @param enterpriseId ID de la empresa.
   * @param status Filtro por estado (opcional).
   * @returns Lista de solicitudes.
   */
  async list(
    enterpriseId: string,
    status?: LoanRequest['status'],
  ): Promise<LoanRequest[]> {
    return this.repository.findRequestsByEnterprise(enterpriseId, status);
  }

  /**
   * Lista solicitudes de un colaborador.
   * @param collaboratorId ID del colaborador.
   * @param status Filtro por estado (opcional).
   * @returns Lista de solicitudes del colaborador.
   */
  async listByCollaborator(
    collaboratorId: string,
    status?: LoanRequest['status'],
  ): Promise<LoanRequest[]> {
    return this.repository.findRequestsByCollaborator(collaboratorId, status);
  }

  /**
   * Aprueba o deniega una solicitud.
   * @param requestId ID de la solicitud.
   * @param decision Aprobada o denegada.
   * @param denialReason Motivo del rechazo (solo para denegadas).
   * @returns Solicitud actualizada.
   */
  async resolve(
    requestId: string,
    decision: 'approved' | 'denied',
    denialReason?: string,
  ): Promise<LoanRequest> {
    const request = await this.repository.findRequestById(requestId);

    if (!request) {
      throw new NotFoundException('Solicitud no encontrada.');
    }

    if (request.status !== 'pending') {
      throw new BadRequestException(
        'Solo se pueden resolver solicitudes pendientes.',
      );
    }

    // Al aprobar la empresa, el estado intermedio es 'company_approved'
    request.status = decision === 'approved' ? 'company_approved' : 'denied';
    request.denialReason =
      decision === 'denied' ? (denialReason ?? null) : null;
    request.updatedAt = new Date().toISOString();

    const savedRequest = await this.repository.saveRequest(request);

    // Sincronizar el estado de la transacción asociada (solo si es denegada pasa a failed)
    try {
      const transaction = await this.repository.findTransactionById(requestId);
      if (transaction) {
        if (decision === 'denied') {
          transaction.status = 'failed';
          await this.repository.saveTransaction(transaction);
        }
      }
    } catch (e) {
      // Ignorar fallas al sincronizar transacción asociada
    }

    return savedRequest;
  }

  /**
   * Aprueba o deniega una solicitud por parte del área de Finanzas.
   * @param requestId ID de la solicitud.
   * @param decision Aprobada o denegada por finanzas.
   * @param denialReason Motivo del rechazo (solo para denegadas).
   * @returns Solicitud actualizada.
   */
  async resolveByFinance(
    requestId: string,
    decision: 'approved' | 'denied',
    denialReason?: string,
  ): Promise<LoanRequest> {
    const request = await this.repository.findRequestById(requestId);

    if (!request) {
      throw new NotFoundException('Solicitud no encontrada.');
    }

    if (request.status !== 'company_approved') {
      throw new BadRequestException(
        'Solo se pueden resolver por finanzas aquellas solicitudes aprobadas previamente por la empresa.',
      );
    }

    request.status = decision;
    request.denialReason =
      decision === 'denied' ? (denialReason ?? null) : null;
    request.updatedAt = new Date().toISOString();

    const savedRequest = await this.repository.saveRequest(request);

    // Sincronizar el estado definitivo de la transacción asociada
    try {
      const transaction = await this.repository.findTransactionById(requestId);
      if (transaction) {
        transaction.status = decision === 'approved' ? 'paid' : 'failed';
        await this.repository.saveTransaction(transaction);
      }
    } catch (e) {
      // Ignorar fallas al sincronizar transacción asociada
    }

    return savedRequest;
  }

  /**
   * Marca una solicitud de préstamo como adquirida y ejecuta las acciones postventa del producto.
   * @param requestId ID de la solicitud de préstamo.
   * @param productId ID del producto que se está adquiriendo.
   * @returns La solicitud actualizada.
   */
  async acquire(requestId: string, productId: string): Promise<LoanRequest> {
    const request = await this.repository.findRequestById(requestId);

    if (!request) {
      throw new NotFoundException('Solicitud no encontrada.');
    }

    if (request.status !== 'approved') {
      throw new BadRequestException(
        'Solo se pueden adquirir solicitudes aprobadas.',
      );
    }

    request.status = 'acquired';
    request.updatedAt = new Date().toISOString();

    const savedRequest = await this.repository.saveRequest(request);

    // ─────────────────────────────────────────────────────────────────────────
    // Acción de postventa: Desembolso de fondos (disburse_funds)
    // ─────────────────────────────────────────────────────────────────────────
    try {
      const product = await this.productRepository.findById(productId);
      if (product && product.actions) {
        const disburseAction = product.actions.find(
          (act) => act.type === 'disburse_funds' && act.active,
        );

        if (disburseAction) {
          // Buscar perfil del colaborador para obtener sus datos bancarios
          const profile = await this.repository.findCollaboratorById(
            request.collaboratorId,
          );

          if (!profile) {
            throw new Error('No se encontró el perfil del colaborador para procesar el desembolso.');
          }

          if (!profile.debitCard || !profile.debitCard.cardNumber || !profile.debitCard.bank) {
            throw new Error('El colaborador no posee datos de cuenta bancaria registrados en su perfil.');
          }

          // Obtener exchange rate
          let exchangeRate = 1;
          try {
            const rateObj = await this.paymentProcessorService.getLastExchangeRate();
            if (rateObj && rateObj.bolivaresPerUsd) {
              exchangeRate = Number(rateObj.bolivaresPerUsd);
            }
          } catch (e) {
            // Ignorar y dejar en 1 o lanzar error
          }

          // Determinar el monto en USD (de la acción o de la solicitud como fallback)
          const amountUsd = Number(disburseAction.config.amountUsd ?? request.amount);
          const amountVES = Number((amountUsd * exchangeRate).toFixed(2));

          // Generar idSesion de 16 caracteres: aaaaMMddhhmmSSss
          const now = new Date();
          const idSesion =
            now.getFullYear().toString() +
            (now.getMonth() + 1).toString().padStart(2, '0') +
            now.getDate().toString().padStart(2, '0') +
            now.getHours().toString().padStart(2, '0') +
            now.getMinutes().toString().padStart(2, '0') +
            now.getSeconds().toString().padStart(2, '0') +
            (now.getMilliseconds() % 100).toString().padStart(2, '0');

          // Desembolso mediante Banco Plaza por defecto
          await this.paymentProcessorService.initiateTransfer({
            companyAccountId: product.alternativeBankAccountId || 'GLOBAL_R4_FALLBACK',
            provider: 'PLAZA',
            beneficiaryName: `${profile.name} ${profile.lastName}`,
            beneficiaryId: `${profile.documentType || 'V'}${profile.documentId}`,
            beneficiaryBankCode: profile.debitCard.bank,
            amount: amountVES,
            concept: `Desembolso prestamo: ${product.name}`,
            beneficiaryAccount: profile.debitCard.cardNumber,
            userIp: '127.0.0.1',
          }, { sub: 'elmio-system' } as any);
        }
      }
    } catch (error) {
      console.error('Error al ejecutar la acción de postventa disburse_funds:', error);
    }

    return savedRequest;
  }
}
