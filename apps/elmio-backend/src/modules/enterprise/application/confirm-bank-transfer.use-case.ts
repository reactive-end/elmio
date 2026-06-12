import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  ENTERPRISE_REPOSITORY_PORT,
  type EnterpriseRepositoryPort,
} from '../domain/ports/enterprise-repository.port';

export interface ConfirmBankTransferInput {
  /** ID de la transaction (cargo) a la que se asocia el comprobante. */
  transactionId: string;
  /** URL del comprobante ya subido al bucket (GCS o similar). */
  receiptUrl: string;
  /** Referencia visible en el comprobante. */
  reference: string;
  /** Banco emisor (codigo o nombre). */
  bankCode: string;
  /** ID del usuario que sube el comprobante. */
  uploadedByUserId: string;
}

export interface ConfirmBankTransferResult {
  transactionId: string;
  status: 'pending' | 'paid';
  paymentMethod: 'r4_transfer';
}

/**
 * Registra el comprobante de una transferencia bancaria sobre una
 * transaction existente. La transaction queda en `pending` hasta que
 * finanzas la concilie manualmente.
 *
 *  - En esta primera fase NO integramos con R4 para transferencias:
 *    la conciliacion es 100% manual por el equipo de finanzas.
 *  - Cuando llegue la spec de R4 para transferencias, se reemplaza
 *    la conciliacion manual por una llamada al servicio R4.
 *
 *  Pre-requisito: el comprobante debe estar subido al bucket antes
 *  de llamar a este use case (se hace desde el frontend con un
 *  POST /api/bucket/upload que devuelve la URL).
 */
@Injectable()
export class ConfirmBankTransferUseCase {
  private readonly logger = new Logger(ConfirmBankTransferUseCase.name);

  constructor(
    @Inject(ENTERPRISE_REPOSITORY_PORT)
    private readonly repository: EnterpriseRepositoryPort,
  ) {}

  async execute(
    input: ConfirmBankTransferInput,
  ): Promise<ConfirmBankTransferResult> {
    if (!input.receiptUrl || !input.reference) {
      throw new BadRequestException('Falta el comprobante o la referencia.');
    }

    const existing = await this.repository.findTransactionById(
      input.transactionId,
    );
    if (!existing) {
      throw new NotFoundException('Transacción no encontrada.');
    }

    if (existing.status === 'paid') {
      throw new BadRequestException('La transacción ya fue cobrada.');
    }

    // Persistimos los metadatos de pago. La transaction queda en
    // 'pending' hasta conciliacion manual.
    const updated = {
      ...existing,
      paymentMethod: 'r4_transfer' as const,
      paymentReference: input.reference,
      transferReceiptUrl: input.receiptUrl,
      // transferVerifiedAt permanece null hasta que finanzas concilie.
      transferVerifiedAt: null,
    };

    await this.repository.saveTransaction(updated);

    this.logger.log(
      `Comprobante de transferencia registrado para tx=${input.transactionId} ref=${input.reference}`,
    );

    return {
      transactionId: input.transactionId,
      status: 'pending',
      paymentMethod: 'r4_transfer',
    };
  }
}
