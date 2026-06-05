import { QueryRunner } from 'typeorm';
import { CustomMigration } from '../custom-migration.interface';

/**
 * Agrega la columna `productId` a la tabla `loan_requests` para poder
 * identificar el producto asociado a cada solicitud y saber si requiere
 * desembolso manual (`manual_disburse`) en el flujo de finanzas.
 */
export class AddProductIdToLoanRequestsMigration implements CustomMigration {
  readonly name = '0008_add_product_id_to_loan_requests';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='loan_requests' AND column_name='productId'
        ) THEN
          ALTER TABLE "loan_requests" ADD COLUMN "productId" varchar(36);
        END IF;
      END $$;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "loan_requests" DROP COLUMN "productId"`,
    );
  }
}
