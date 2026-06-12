import { QueryRunner } from 'typeorm';
import { CustomMigration } from '../custom-migration.interface';

/**
 * Migracion 0011 - Cobranza empresarial.
 *
 * Agrega las columnas necesarias para soportar el modulo de cobranza:
 *
 *   Fase 1 - Buckets de morosidad (12):
 *     - purchases.delinquency_bucket     -- 'current' | 'overdue_30' | 'overdue_60' | 'overdue_90' | 'legal'
 *     - purchases.overdue_since          -- fecha desde la cual el cargo esta vencido
 *
 *   Fase 2 - Abonos parciales (11):
 *     - purchases.amount_due             -- monto total adeudado (espejo del cargo)
 *     - purchases.amount_paid            -- acumulado de pagos parciales
 *     - purchases.due_date               -- fecha de vencimiento del cargo
 *     - transactions.applied_to_purchase -- FK logica al purchase al que aplica el pago
 *
 *   Fase 3 - Metodos de pago de empresa (10):
 *     - transactions.payment_method       -- 'r4_immediate_debit' | 'r4_transfer' | null
 *     - transactions.payment_reference    -- referencia R4 o de la transferencia
 *     - transactions.transfer_receipt_url -- URL del comprobante subido a GCS
 *     - transactions.transfer_verified_at -- timestamp de conciliacion por finanzas
 *
 * Todas las columnas son NULLABLE para no romper registros existentes.
 * Los indices agregados (delinquency_bucket, due_date) son para soportar
 * los queries del dashboard de finanzas y el job de recalculo diario.
 */
export class AddPaymentAndDelinquencyFieldsMigration implements CustomMigration {
  readonly name = '0011_add_payment_and_delinquency_fields';

  async up(queryRunner: QueryRunner): Promise<void> {
    // -- Fase 1: Buckets de morosidad en purchases --
    await queryRunner.query(
      `ALTER TABLE "purchases" ADD COLUMN "delinquency_bucket" varchar(20)`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchases" ADD COLUMN "overdue_since" timestamp with time zone`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_purchases_delinquency_bucket" ON "purchases" ("delinquency_bucket")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_purchases_due_date" ON "purchases" ("due_date")`,
    );

    // -- Fase 2: Abonos parciales en purchases --
    await queryRunner.query(
      `ALTER TABLE "purchases" ADD COLUMN "amount_due" decimal(10, 2)`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchases" ADD COLUMN "amount_paid" decimal(10, 2) NOT NULL DEFAULT 0`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchases" ADD COLUMN "due_date" timestamp with time zone`,
    );
    // Backfill: amount_due espeja amount_usd para purchases existentes
    // (los registros pre-cobranza no tienen importe distinto al adeudado).
    await queryRunner.query(
      `UPDATE "purchases" SET "amount_due" = "amount_usd" WHERE "amount_due" IS NULL`,
    );

    // -- Fase 3: Metodos de pago en transactions --
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD COLUMN "payment_method" varchar(30)`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD COLUMN "payment_reference" varchar(100)`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD COLUMN "transfer_receipt_url" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD COLUMN "transfer_verified_at" timestamp with time zone`,
    );
    // -- Fase 2: Referencia al purchase que un pago parcial esta saldando --
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD COLUMN "applied_to_purchase_id" uuid`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_transactions_payment_method" ON "transactions" ("payment_method")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_transactions_applied_to_purchase" ON "transactions" ("applied_to_purchase_id")`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback en orden inverso.

    // -- Fase 3 / Fase 2 (transactions) --
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_transactions_applied_to_purchase"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_transactions_payment_method"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN "applied_to_purchase_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN "transfer_verified_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN "transfer_receipt_url"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN "payment_reference"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP COLUMN "payment_method"`,
    );

    // -- Fase 2 (purchases) --
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_purchases_due_date"`);
    await queryRunner.query(`ALTER TABLE "purchases" DROP COLUMN "due_date"`);
    await queryRunner.query(
      `ALTER TABLE "purchases" DROP COLUMN "amount_paid"`,
    );
    await queryRunner.query(`ALTER TABLE "purchases" DROP COLUMN "amount_due"`);

    // -- Fase 1 (purchases) --
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_purchases_delinquency_bucket"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchases" DROP COLUMN "overdue_since"`,
    );
    await queryRunner.query(
      `ALTER TABLE "purchases" DROP COLUMN "delinquency_bucket"`,
    );
  }
}
