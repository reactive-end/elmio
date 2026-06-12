import { QueryRunner } from 'typeorm';
import { CustomMigration } from '../custom-migration.interface';

/**
 * Agrega la columna `isActive` a la tabla `users` para soportar
 * soft-delete (eliminación lógica) en la gestión de usuarios.
 */
export class AddIsActiveToUsersMigration implements CustomMigration {
  readonly name = '0010_add_is_active_to_users';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "isActive" boolean NOT NULL DEFAULT true`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "isActive"`);
  }
}
