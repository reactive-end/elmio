import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { DataSource } from 'typeorm';
import {
  ENTERPRISE_REPOSITORY_PORT,
  type EnterpriseRepositoryPort,
} from '../domain/ports/enterprise-repository.port';
import type { Transaction } from '../domain/enterprise';

export interface RegisterPartialPaymentInput {
  /** ID de la empresa a la que pertenece el purchase. */
  enterpriseId: string;
  /** ID del purchase al que se aplica el abono. */
  purchaseId: string;
  /** ID del usuario (representante o finance) que registra el abono. */
  registeredByUserId: string;
  /** Rol del usuario que registra el abono (para el concepto). */
  registeredByRole: 'COMPANY' | 'FINANCE' | 'ADMIN';
  /** Monto del abono en USD. */
  amountUsd: number;
  /** Metodo de pago. Para Fase 3 se amplia. */
  paymentMethod:
    | 'r4_immediate_debit'
    | 'r4_transfer'
    | 'manual'
    | 'cash'
    | null;
  /** Referencia opcional. */
  paymentReference?: string | null;
}

/**
 * Registra un abono parcial sobre un Purchase vencido (o pendiente).
 *
 *  - Valida que el monto sea positivo y no supere el saldo insoluto.
 *  - Crea una Transaction tipo 'payment' con `appliedToPurchaseId`.
 *  - Actualiza `Purchase.amountPaid` y (si queda saldado) `Purchase.status = 'paid'`.
 *  - Si queda saldo, marca el Purchase como `partially_paid`.
 *
 *  Atomicidad: la actualizacion del Purchase y la creacion de la
 *  Transaction se hacen en una transaccion de TypeORM (QueryRunner).
 *  Si algo falla, se hace rollback completo.
 *
 *  Autorizacion: el representante (COMPANY) solo puede abonar
 *  purchases de su propia empresa; FINANCE y ADMIN pueden sobre
 *  cualquiera. Esta validacion es de capa de aplicacion (no de
 *  RolesGuard) porque requiere conocer el purchaser.
 */
@Injectable()
export class RegisterPartialPaymentUseCase {
  constructor(
    @Inject(ENTERPRISE_REPOSITORY_PORT)
    private readonly repository: EnterpriseRepositoryPort,
    private readonly dataSource: DataSource,
  ) {}

  async execute(input: RegisterPartialPaymentInput): Promise<Transaction> {
    if (input.amountUsd <= 0) {
      throw new BadRequestException('El monto del abono debe ser positivo.');
    }

    const purchase = await this.repository.findPurchaseById(input.purchaseId);
    if (!purchase) {
      throw new NotFoundException('Purchase no encontrado.');
    }

    // Autorizacion: representante solo sobre su empresa
    if (input.registeredByRole === 'COMPANY') {
      if (
        purchase.purchaserType !== 'enterprise' ||
        purchase.purchaserId !== input.enterpriseId
      ) {
        throw new ForbiddenException(
          'El representante solo puede abonar purchases de su propia empresa.',
        );
      }
    }

    if (
      purchase.status === 'paid' ||
      purchase.status === 'cancelled' ||
      purchase.status === 'disbursed'
    ) {
      throw new BadRequestException(
        `El purchase ya esta en estado '${purchase.status}' y no admite abonos.`,
      );
    }

    const amountDue = purchase.amountDue ?? purchase.amountUsd;
    const currentPaid = purchase.amountPaid;
    const balance = Number((amountDue - currentPaid).toFixed(2));

    if (input.amountUsd > balance + 0.01) {
      throw new BadRequestException(
        `El monto del abono (${input.amountUsd}) supera el saldo insoluto (${balance}).`,
      );
    }

    const newAmountPaid = Number((currentPaid + input.amountUsd).toFixed(2));
    const isPaidOff = newAmountPaid >= amountDue - 0.01;
    const newStatus = isPaidOff ? 'paid' : 'partially_paid';

    const transactionId = randomUUID();
    const now = new Date().toISOString();
    const transaction: Transaction = {
      id: transactionId,
      enterpriseId: input.enterpriseId,
      collaboratorId: null,
      kind: 'payment',
      concept: `Abono parcial a ${purchase.productName} (${purchase.id})`,
      amount: input.amountUsd,
      status: 'paid',
      date: now,
      paymentMethod: input.paymentMethod as
        | 'r4_immediate_debit'
        | 'r4_transfer'
        | null,
      paymentReference: input.paymentReference ?? null,
      transferReceiptUrl: null,
      transferVerifiedAt: null,
      appliedToPurchaseId: purchase.id,
    };

    // Transaccion atomica: actualizar Purchase + crear Transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      await queryRunner.manager
        .createQueryBuilder()
        .update('purchases')
        .set({
          amountPaid: newAmountPaid,
          status: newStatus,
          delinquencyBucket: isPaidOff ? 'current' : purchase.delinquencyBucket,
        })
        .where('id = :id', { id: purchase.id })
        .execute();

      await queryRunner.manager
        .createQueryBuilder()
        .insert()
        .into('transactions')
        .values({
          id: transaction.id,
          enterpriseId: transaction.enterpriseId,
          collaboratorId: null,
          kind: transaction.kind,
          concept: transaction.concept,
          amount: transaction.amount,
          status: transaction.status,
          date: transaction.date,
          paymentMethod: transaction.paymentMethod,
          paymentReference: transaction.paymentReference,
          transferReceiptUrl: null,
          transferVerifiedAt: null,
          appliedToPurchaseId: transaction.appliedToPurchaseId,
        })
        .execute();

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    return transaction;
  }
}
