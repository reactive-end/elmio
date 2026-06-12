import { QueryRunner } from 'typeorm';
import { CustomMigration } from '../custom-migration.interface';

export class AddAlternativeBankAccountAndActionsToProductsMigration implements CustomMigration {
  readonly name = '0003_add_alternative_bank_account_and_actions_to_products';

  async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Agregar la columna alternativeBankAccountId (uuid, nullable)
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "alternativeBankAccountId" uuid`,
    );

    // 2. Agregar la columna actions (text, nullable)
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "actions" text`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir los cambios eliminando las columnas de forma segura
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "alternativeBankAccountId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "actions"`,
    );
  }
}
