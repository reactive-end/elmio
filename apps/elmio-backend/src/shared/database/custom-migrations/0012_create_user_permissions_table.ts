import { QueryRunner } from 'typeorm';
import { CustomMigration } from '../custom-migration.interface';

/**
 * Crea la tabla `user_permissions` para almacenar los overrides
 * de permisos de visibilidad para usuarios especificos.
 */
export class CreateUserPermissionsTableMigration implements CustomMigration {
  readonly name = '0012_create_user_permissions_table';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_permissions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL,
        "groupKey" varchar(100) NOT NULL,
        "visible" boolean NOT NULL DEFAULT true,
        "created_at" timestamp with time zone NOT NULL DEFAULT now(),
        "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_user_permissions_user_groupKey" UNIQUE ("userId", "groupKey")
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_permissions"`);
  }
}
