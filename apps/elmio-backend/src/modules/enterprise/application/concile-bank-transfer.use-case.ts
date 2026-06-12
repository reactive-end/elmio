import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  ENTERPRISE_REPOSITORY_PORT,
  type EnterpriseRepositoryPort,
} from '../domain/ports/enterprise-repository.port';

export interface ConciliateBankTransferInput {
  transactionId: string;
  /** ID del usuario de finanzas que concilia. */
  financeUserId: string;
  /** Notas opcionales del conciliador. */
  notes?: string | null;
}

/**
 * Concilia manualmente una transferencia previamente registrada.
 * Cambia `status` de la transaction a 'paid' y setea
 * `transferVerifiedAt` con el timestamp actual.
 *
 * Solo accesible por usuarios con rol FINANCE o ADMIN (validado
 * en el controller con @Roles).
 */
@Injectable()
export class ConciliateBankTransferUseCase {
  private readonly logger = new Logger(ConciliateBankTransferUseCase.name);

  constructor(
    @Inject(ENTERPRISE_REPOSITORY_PORT)
    private readonly repository: EnterpriseRepositoryPort,
  ) {}

  async execute(input: ConciliateBankTransferInput): Promise<void> {
    const tx = await this.repository.findTransactionById(input.transactionId);
    if (!tx) {
      throw new NotFoundException('Transacción no encontrada.');
    }

    if (tx.status === 'paid') {
      return; // idempotente
    }

    if (tx.paymentMethod !== 'r4_transfer') {
      // No es una transferencia; el flujo de debito inmediato es directo
      // y no requiere conciliacion.
      return;
    }

    if (!tx.transferReceiptUrl) {
      throw new NotFoundException(
        'La transacción no tiene un comprobante cargado. Suba el comprobante antes de conciliar.',
      );
    }

    const updated = {
      ...tx,
      status: 'paid' as const,
      transferVerifiedAt: new Date().toISOString(),
    };

    await this.repository.saveTransaction(updated);

    this.logger.log(
      `Transferencia conciliada tx=${input.transactionId} por financeUser=${input.financeUserId}`,
    );
  }
}
