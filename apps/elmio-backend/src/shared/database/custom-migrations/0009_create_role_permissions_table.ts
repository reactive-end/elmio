import { QueryRunner } from 'typeorm';
import { CustomMigration } from '../custom-migration.interface';

/**
 * Crea la tabla `role_permissions` para almacenar la configuracion
 * de visibilidad de grupos de la sidebar por rol.
 */
export class CreateRolePermissionsTableMigration implements CustomMigration {
  readonly name = '0009_create_role_permissions_table';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "role_permissions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "role" varchar(50) NOT NULL,
        "groupKey" varchar(100) NOT NULL,
        "visible" boolean NOT NULL DEFAULT true,
        "created_at" timestamp with time zone NOT NULL DEFAULT now(),
        "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_role_permissions_role_groupKey" UNIQUE ("role", "groupKey")
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "role_permissions"`);
  }
}
