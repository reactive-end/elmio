import { QueryRunner } from 'typeorm';
import { CustomMigration } from '../custom-migration.interface';

export class AddRoleToBankAccountMigration implements CustomMigration {
  readonly name = '0005_add_role_to_bank_account';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='bank_account' AND column_name='role'
        ) THEN
          ALTER TABLE "bank_account" ADD COLUMN "role" VARCHAR(20) NOT NULL DEFAULT 'RECEPTOR';
        END IF;
      END $$;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "bank_account" DROP COLUMN "role"`);
  }
}
