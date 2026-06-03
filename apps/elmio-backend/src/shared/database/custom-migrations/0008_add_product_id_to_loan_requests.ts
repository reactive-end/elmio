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
    await queryRunner.query(
      `ALTER TABLE "loan_requests" ADD COLUMN "productId" varchar(36)`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "loan_requests" DROP COLUMN "productId"`,
    );
  }
}
