import { QueryRunner } from 'typeorm';
import { CustomMigration } from '../custom-migration.interface';

export class MakeTransactionEnterpriseIdNullableMigration implements CustomMigration {
  readonly name = '0004_make_transaction_enterprise_id_nullable';

  async up(queryRunner: QueryRunner): Promise<void> {
    // Eliminar la restricción NOT NULL en la columna enterpriseId
    await queryRunner.query(
      `ALTER TABLE "transactions" ALTER COLUMN "enterpriseId" DROP NOT NULL`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // Restablecer la restricción NOT NULL en la columna enterpriseId
    // Nota: Si hay registros con enterpriseId nulo, esto fallará en down,
    // lo cual es el comportamiento esperado en rollback si hay inconsistencias.
    await queryRunner.query(
      `ALTER TABLE "transactions" ALTER COLUMN "enterpriseId" SET NOT NULL`,
    );
  }
}
