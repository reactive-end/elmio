import type { CustomMigration } from '../custom-migration.interface';

export class CreateDisbursementTableMigration implements CustomMigration {
  name = 'CreateDisbursementTableMigration'
  version = 7

  async up(queryRunner: any): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "disbursement" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "loanRequestId" uuid NOT NULL,
        "paymentId" uuid NOT NULL,
        "financeUserId" varchar(36) NOT NULL,
        "financeUserName" varchar(255) NOT NULL,
        "amount_usd" decimal(10,2) NOT NULL,
        "amount_bs" decimal(15,2) NOT NULL,
        "exchange_rate" decimal(15,4) NOT NULL,
        "bank_code" varchar(4) NOT NULL,
        "account_number" varchar(20) NOT NULL,
        "phone_number" varchar(20) NOT NULL,
        "document_id" varchar(20) NOT NULL,
        "concept" text NOT NULL,
        "bank_reference" varchar(100),
        "bank_operation_id" varchar(100),
        "status" varchar(20) NOT NULL DEFAULT 'success',
        "created_at" timestamp with time zone NOT NULL DEFAULT now()
      )
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_disbursement_loanRequestId"
        ON "disbursement"("loanRequestId")
    `)
  }

  async down(queryRunner: any): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "disbursement"`)
  }
}
