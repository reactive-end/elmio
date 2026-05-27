import { QueryRunner } from 'typeorm';
import { CustomMigration } from '../custom-migration.interface';

export class AddActionsToProductsMigration implements CustomMigration {
  readonly name = '0001_add_actions_to_products';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "actions" text`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "products" DROP COLUMN IF EXISTS "actions"`,
    );
  }
}
