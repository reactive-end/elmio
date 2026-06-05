import { QueryRunner } from 'typeorm';
import { CustomMigration } from '../custom-migration.interface';

/**
 * Crea la tabla `custom_roles` para almacenar los roles creados
 * dinamicamente por los administradores.
 */
export class CreateCustomRolesTableMigration implements CustomMigration {
  readonly name = '0013_create_custom_roles_table';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "custom_roles" (
        "key" varchar(50) PRIMARY KEY,
        "name" varchar(100) NOT NULL,
        "created_at" timestamp with time zone NOT NULL DEFAULT now(),
        "updated_at" timestamp with time zone NOT NULL DEFAULT now()
      )
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "custom_roles"`);
  }
}
