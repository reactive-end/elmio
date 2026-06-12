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
import { PaymentProcessorService } from '../../payment-processor/application/services/payment-processor.service';
import type { Purchase } from '../domain/purchase';

export interface CreatePurchaseInput {
  purchaserType: 'natural_client' | 'collaborator' | 'enterprise';
  purchaserId: string;
  purchaserName: string;
  purchaserEmail?: string;
  purchaserDocument?: string;
  productId?: string;
  productName: string;
  productSku?: string;
  marketplaceId?: string;
  marketplaceName?: string;
  amountUsd: number;
  isFinanced: boolean;
  installments?: number;
  interestRate?: number;
  channel: 'marketplace' | 'loan_request' | 'insurance';
  transactionId?: string;
  status?:
    | 'pending'
    | 'paid'
    | 'financed'
    | 'disbursed'
    | 'cancelled'
    | 'partially_paid';
  /** Modulo de cobranza (migracion 0011). ISO 8601 o null. */
  dueDate?: string | null;
}

/**
 * Crea registros de Purchase/orden para trazabilidad de compras.
 * Usado por el checkout del marketplace para registrar una compra
 * confirmada (T1) con su tasa de cambio BCV consultada al backend.
 */
@Injectable()
export class ManagePurchasesUseCase {
  constructor(
    @Inject(ENTERPRISE_REPOSITORY_PORT)
    private readonly repository: EnterpriseRepositoryPort,
    private readonly paymentProcessorService: PaymentProcessorService,
  ) {}

  /**
   * Crea una nueva compra/orden. Si la compra es en bolivares (cualquier canal
   * que no sea `loan_request` ya desembolsado) consulta la tasa BCV de R4
   * para calcular amountVes y exchangeRate.
   * @param input Datos de la compra.
   * @returns Compra persistida.
   */
  async execute(input: CreatePurchaseInput): Promise<Purchase> {
    if (!Number.isFinite(input.amountUsd) || input.amountUsd <= 0) {
      throw new BadRequestException('amountUsd debe ser mayor a cero.');
    }
    if (!input.productName?.trim()) {
      throw new BadRequestException('productName es obligatorio.');
    }

    // Consultar tasa de cambio BCV para calcular amountVes.
    let exchangeRate: number | null = null;
    let amountVes: number | null = null;

    try {
      const dbRate = await this.paymentProcessorService.getLastExchangeRate();
      if (dbRate && dbRate.bolivaresPerUsd) {
        exchangeRate = Number(dbRate.bolivaresPerUsd);
      } else {
        const today = new Date().toISOString().split('T')[0];
        const rateResponse = await this.paymentProcessorService.getExchangeRate(
          {
            companyAccountId: 'GLOBAL_R4_FALLBACK',
            date: today,
            currency: 'USD',
          },
        );
        if (rateResponse?.exchangeRate) {
          exchangeRate = rateResponse.exchangeRate;
        }
      }
    } catch {
      // Si no se puede obtener la tasa, se guarda sin amountVes.
    }

    if (exchangeRate !== null) {
      amountVes = Number((input.amountUsd * exchangeRate).toFixed(2));
    }

    const now = new Date().toISOString();
    const purchase: Purchase = {
      id: randomUUID(),
      purchaserType: input.purchaserType,
      purchaserId: input.purchaserId,
      purchaserName: input.purchaserName,
      purchaserEmail: input.purchaserEmail ?? null,
      purchaserDocument: input.purchaserDocument ?? null,
      productId: input.productId ?? null,
      productName: input.productName,
      productSku: input.productSku ?? null,
      marketplaceId: input.marketplaceId ?? null,
      marketplaceName: input.marketplaceName ?? null,
      amountUsd: input.amountUsd,
      amountVes,
      exchangeRate,
      isFinanced: input.isFinanced,
      installments: input.installments ?? null,
      interestRate: input.interestRate ?? null,
      channel: input.channel,
      transactionId: input.transactionId ?? null,
      loanRequestId: null,
      disbursementId: null,
      status: input.status ?? 'paid',
      // Para purchases nuevas, amountDue espeja amountUsd y amountPaid
      // queda en 0 (todavia no se aplica pago). El job CRON recalcula
      // el bucket diariamente segun dueDate.
      amountDue: input.amountUsd,
      amountPaid: 0,
      dueDate: input.dueDate ?? null,
      delinquencyBucket: 'current',
      overdueSince: null,
      createdAt: now,
      updatedAt: now,
    };

    return this.repository.savePurchase(purchase);
  }
}
