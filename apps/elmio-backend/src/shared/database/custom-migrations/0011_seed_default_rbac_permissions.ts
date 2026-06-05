import { QueryRunner } from 'typeorm';
import { randomUUID } from 'node:crypto';
import { CustomMigration } from '../custom-migration.interface';

/**
 * Inserta la configuración inicial de permisos RBAC en la tabla `role_permissions`
 * alineando la seguridad del backend con la visibilidad por defecto del sidebar del frontend.
 */
export class SeedDefaultRbacPermissionsMigration implements CustomMigration {
  readonly name = '0011_seed_default_rbac_permissions';

  private readonly roles = [
    'ADMIN',
    'FINANCE',
    'COMPANY',
    'EMPLOYEE',
    'CLIENT',
    'ALLIED',
  ];

  private readonly groupKeys = [
    'products-list',
    'products-new',
    'marketplaces',
    'gallery-library',
    'enterprise-onboarding',
    'enterprise-account',
    'enterprise-collaborators',
    'enterprise-requests',
    'enterprise-contracts',
    'finance-requests',
    'finance-purchases',
    'config-whatsapp',
    'config-enterprise-interest-rates',
    'config-allies',
    'config-rbac',
    'config-bank-accounts',
    'config-currencies',
    'config-finance-users',
  ];

  private readonly defaultVisibility: Record<string, string[]> = {
    ADMIN: [
      'products-list',
      'products-new',
      'marketplaces',
      'gallery-library',
      'enterprise-onboarding',
      'enterprise-account',
      'enterprise-collaborators',
      'enterprise-requests',
      'enterprise-contracts',
      'finance-requests',
      'finance-purchases',
      'config-whatsapp',
      'config-enterprise-interest-rates',
      'config-allies',
      'config-rbac',
      'config-bank-accounts',
      'config-currencies',
      'config-finance-users',
    ],
    FINANCE: ['products-list', 'finance-requests', 'finance-purchases'],
    COMPANY: [
      'products-list',
      'enterprise-onboarding',
      'enterprise-account',
      'enterprise-collaborators',
      'enterprise-requests',
      'enterprise-contracts',
    ],
    EMPLOYEE: ['products-list'],
    CLIENT: ['products-list'],
    ALLIED: [
      'products-list',
      'products-new',
      'marketplaces',
      'gallery-library',
    ],
  };

  async up(queryRunner: QueryRunner): Promise<void> {
    const values: string[] = [];
    for (const role of this.roles) {
      const allowedKeys = this.defaultVisibility[role] || [];
      for (const groupKey of this.groupKeys) {
        const visible = allowedKeys.includes(groupKey);
        values.push(`('${randomUUID()}', '${role}', '${groupKey}', ${visible})`);
      }
    }

    if (values.length > 0) {
      await queryRunner.query(`
        INSERT INTO "role_permissions" ("id", "role", "groupKey", "visible")
        VALUES ${values.join(',\n        ')}
        ON CONFLICT ("role", "groupKey") DO NOTHING
      `);
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "role_permissions"
      WHERE "groupKey" IN (${this.groupKeys.map((k) => `'${k}'`).join(', ')})
    `);
  }
}
