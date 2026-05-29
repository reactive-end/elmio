import { QueryRunner } from 'typeorm';
import { CustomMigration } from '../custom-migration.interface';
import { randomUUID } from 'crypto';

export class AddFinancingAndLegalRepsMigration implements CustomMigration {
  readonly name = '0002_add_financing_and_legal_reps';

  async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Agregar las nuevas columnas como opcionales
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "financingSchemes" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "enterprises" ADD COLUMN IF NOT EXISTS "additionalLegalReps" text`,
    );

    // 2. Verificar si existen las columnas antiguas
    const columnsCheck = await queryRunner.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'paymentMode'`
    );
    const hasOldColumns = columnsCheck.length > 0;

    if (hasOldColumns) {
      // Transicionar los datos de productos existentes si tienen las columnas viejas
      const products = await queryRunner.query(
        `SELECT "id", "paymentMode", "paymentPeriod", "maxQuotas", "initialPayment" FROM "products"`,
      );

      for (const p of products) {
        const schemes = [
          {
            id: randomUUID(),
            name: 'Plan Predeterminado',
            paymentMode: p.paymentMode || 'cash',
            paymentPeriod: p.paymentPeriod || 'monthly',
            maxQuotas: p.maxQuotas !== undefined && p.maxQuotas !== null ? Number(p.maxQuotas) : 1,
            initialPayment: p.initialPayment !== undefined && p.initialPayment !== null ? Number(p.initialPayment) : 0,
          },
        ];

        await queryRunner.query(
          `UPDATE "products" SET "financingSchemes" = $1 WHERE "id" = $2`,
          [JSON.stringify(schemes), p.id],
        );
      }

      // 3. Eliminar columnas redundantes antiguas de products
      await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "paymentMode"`);
      await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "paymentPeriod"`);
      await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "maxQuotas"`);
      await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "initialPayment"`);
    } else {
      // Si ya no existen las columnas antiguas (porque TypeORM synchronize las borró), 
      // aseguramos que todos los productos tengan al menos un esquema predeterminado si está vacío o nulo
      const products = await queryRunner.query(
        `SELECT "id", "financingSchemes" FROM "products"`,
      );
      for (const p of products) {
        if (!p.financingSchemes || p.financingSchemes === '[]' || p.financingSchemes === 'null') {
          const schemes = [
            {
              id: randomUUID(),
              name: 'Plan Predeterminado',
              paymentMode: 'cash',
              paymentPeriod: 'monthly',
              maxQuotas: 1,
              initialPayment: 0,
            },
          ];
          await queryRunner.query(
            `UPDATE "products" SET "financingSchemes" = $1 WHERE "id" = $2`,
            [JSON.stringify(schemes), p.id],
          );
        }
      }
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Volver a agregar las columnas antiguas
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "paymentMode" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "paymentPeriod" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "maxQuotas" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "initialPayment" float`,
    );

    // 2. Intentar repoblar las columnas antiguas desde financingSchemes
    const products = await queryRunner.query(
      `SELECT "id", "financingSchemes" FROM "products"`,
    );

    for (const p of products) {
      if (p.financingSchemes) {
        try {
          const schemes = JSON.parse(p.financingSchemes);
          const first = schemes[0];
          if (first) {
            await queryRunner.query(
              `UPDATE "products" SET "paymentMode" = $1, "paymentPeriod" = $2, "maxQuotas" = $3, "initialPayment" = $4 WHERE "id" = $5`,
              [
                first.paymentMode || 'cash',
                first.paymentPeriod || 'monthly',
                first.maxQuotas || 1,
                first.initialPayment || 0,
                p.id,
              ],
            );
          }
        } catch {
          // Ignorar fallos de deserialización en el rollback
        }
      }
    }

    // 3. Eliminar las nuevas columnas
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "financingSchemes"`);
    await queryRunner.query(`ALTER TABLE "enterprises" DROP COLUMN IF EXISTS "additionalLegalReps"`);
  }
}
