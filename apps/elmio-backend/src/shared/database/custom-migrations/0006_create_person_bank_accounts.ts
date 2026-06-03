import type { CustomMigration } from '../custom-migration.interface';

export class CreatePersonBankAccountsMigration implements CustomMigration {
  name = 'CreatePersonBankAccountsMigration';
  version = 6;

  async up(queryRunner: any): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "person_bank_accounts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "personProfileId" uuid NOT NULL,
        "bankCode" varchar(4) NOT NULL,
        "bankName" varchar(100) NOT NULL,
        "accountNumber" varchar(20) NOT NULL,
        "phoneNumber" varchar(20) NOT NULL,
        "documentId" varchar(20) NOT NULL,
        "documentPhoto" text,
        "isPrimary" boolean NOT NULL DEFAULT true,
        "created_at" timestamp with time zone NOT NULL DEFAULT now(),
        "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT "FK_person_bank_accounts_personProfileId"
          FOREIGN KEY ("personProfileId") REFERENCES "person_profiles"("id")
          ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_person_bank_accounts_personProfileId"
        ON "person_bank_accounts"("personProfileId")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_person_bank_accounts_isPrimary"
        ON "person_bank_accounts"("isPrimary")
    `);
  }

  async down(queryRunner: any): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "person_bank_accounts"`);
  }
}
