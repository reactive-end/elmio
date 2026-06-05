import { QueryRunner } from 'typeorm';
import { CustomMigration } from '../custom-migration.interface';

/**
 * Agrega la columna `isActive` a la tabla `users` para soportar
 * soft-delete (eliminación lógica) en la gestión de usuarios.
 */
export class AddIsActiveToUsersMigration implements CustomMigration {
  readonly name = '0010_add_is_active_to_users';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='users' AND column_name='isActive'
        ) THEN
          ALTER TABLE "users" ADD COLUMN "isActive" boolean NOT NULL DEFAULT true;
        END IF;
      END $$;
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "isActive"`);
  }
}
