import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  ENTERPRISE_REPOSITORY_PORT,
  type EnterpriseRepositoryPort,
} from '../domain/ports/enterprise-repository.port';
import type { Purchase } from '../domain/purchase';

type DelinquencyBucket = Purchase['delinquencyBucket'];

/**
 * Umbrales (en dias) para clasificar la morosidad de un purchase.
 *   1 a 30   -> 'overdue_30'
 *   31 a 60  -> 'overdue_60'
 *   61 a 90  -> 'overdue_90'
 *   > 90     -> 'legal'
 *   <= 0     -> 'current' (al dia)
 *   saldado  -> 'current'
 */
const BUCKET_THRESHOLDS: Array<{
  maxDays: number;
  bucket: Exclude<DelinquencyBucket, null>;
}> = [
  { maxDays: 30, bucket: 'overdue_30' },
  { maxDays: 60, bucket: 'overdue_60' },
  { maxDays: 90, bucket: 'overdue_90' },
];

/**
 * Job CRON diario que recalcula el bucket de morosidad de todos los
 * purchases con deuda pendiente.
 *
 *  - Frecuencia: cada dia a medianoche (America/Caracas).
 *  - Idempotente: si se ejecuta dos veces seguidas, los buckets
 *    quedan iguales (mismo calculo).
 *  - Performance: procesa solo purchases con `status IN ('pending',
 *    'partially_paid')` y `due_date IS NOT NULL` para no tocar
 *    los ya saldados.
 *
 * Si se quiere forzar un recalculo manual (ej. despues de una
 * carga masiva), basta con invocar `execute()` desde un endpoint
 * de admin o desde otro use case.
 */
@Injectable()
export class RecalculateDelinquencyBucketsUseCase {
  private readonly logger = new Logger(
    RecalculateDelinquencyBucketsUseCase.name,
  );

  constructor(
    @Inject(ENTERPRISE_REPOSITORY_PORT)
    private readonly repository: EnterpriseRepositoryPort,
  ) {}

  /**
   * Handler del CRON. Decorador `@nestjs/schedule` que se ejecuta
   * una vez al dia a la medianoche.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'recalculate-delinquency-buckets',
    timeZone: 'America/Caracas',
  })
  async handleCron(): Promise<void> {
    await this.execute();
  }

  /**
   * Logica de recalculo, expuesta para tests y para ejecucion manual.
   * @returns Cantidad de purchases actualizados.
   */
  async execute(): Promise<number> {
    const start = Date.now();
    this.logger.log('Iniciando recálculo diario de buckets de morosidad...');

    // Traemos todos los purchases con status pendientes. Para una base
    // pequena esto es OK; si crece, paginar en batches.
    const purchases = await this.repository.findAllPurchases();
    const candidates = purchases.filter(
      (p) =>
        (p.status === 'pending' || p.status === 'partially_paid') &&
        p.dueDate !== null,
    );

    const now = new Date();
    let updated = 0;

    for (const purchase of candidates) {
      const amountDue = purchase.amountDue ?? purchase.amountUsd;
      const amountPaid = purchase.amountPaid;
      const isPaidOff = amountPaid >= amountDue;

      let newBucket: DelinquencyBucket;
      let newOverdueSince: string | null = purchase.overdueSince;

      if (isPaidOff) {
        newBucket = 'current';
        newOverdueSince = null;
      } else if (!purchase.dueDate) {
        // sin fecha de vencimiento -> al dia
        newBucket = 'current';
        newOverdueSince = null;
      } else {
        const dueDate = new Date(purchase.dueDate);
        const daysOverdue = Math.floor(
          (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (daysOverdue <= 0) {
          newBucket = 'current';
          newOverdueSince = null;
        } else {
          const threshold = BUCKET_THRESHOLDS.find(
            (t) => daysOverdue <= t.maxDays,
          );
          newBucket = threshold ? threshold.bucket : 'legal';
          // Fijamos overdue_since la primera vez que entra en mora y no se
          // cambia en recalculos posteriores (estable para reportes).
          newOverdueSince = purchase.overdueSince ?? purchase.dueDate;
        }
      }

      if (
        newBucket !== purchase.delinquencyBucket ||
        newOverdueSince !== purchase.overdueSince
      ) {
        await this.repository.updateDelinquencyBucket(
          purchase.id,
          newBucket,
          newOverdueSince,
        );
        updated += 1;
      }
    }

    const elapsed = Date.now() - start;
    this.logger.log(
      `Recálculo finalizado: ${updated} purchase(s) actualizados de ${candidates.length} candidato(s) en ${elapsed}ms.`,
    );
    return updated;
  }
}
