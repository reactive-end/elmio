import 'dotenv/config';
import AppDataSource from './typeorm.datasource';
import { customMigrations } from './custom-migrations';
import { SysMigrationEntity } from '../../modules/migration/infrastructure/entities/sys-migration.entity';

async function setupMigrationTable(): Promise<void> {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();

  // Crear la tabla sys_migrations si no existe
  await queryRunner.query(`
    CREATE TABLE IF NOT EXISTS "sys_migrations" (
      "id" SERIAL PRIMARY KEY,
      "migration" VARCHAR(255) NOT NULL UNIQUE,
      "batch" INTEGER NOT NULL,
      "executedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await queryRunner.release();
}

async function migrate(): Promise<void> {
  console.log('=== INICIANDO MIGRACIONES DE BASE DE DATOS ===');
  await setupMigrationTable();

  const migrationRepo = AppDataSource.getRepository(SysMigrationEntity);
  const executedRecords = await migrationRepo.find();
  const executedSet = new Set<string>(executedRecords.map((r) => r.migration));

  const pending = customMigrations.filter((m) => !executedSet.has(m.name));

  if (pending.length === 0) {
    console.log('No hay migraciones pendientes por aplicar.');
    return;
  }

  // Obtener el lote (batch) máximo actual
  const maxBatchResult = await migrationRepo
    .createQueryBuilder('m')
    .select('MAX(m.batch)', 'max')
    .getRawOne<{ max: number | null }>();
  const nextBatch = (maxBatchResult?.max ?? 0) + 1;

  console.log(
    `Aplicando ${pending.length} migración(es) pendiente(s) en el Lote #${nextBatch}...`,
  );

  for (const m of pending) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      console.log(`> Aplicando: ${m.name}`);
      await m.up(queryRunner);

      // Registrar la migración
      await queryRunner.query(
        `INSERT INTO "sys_migrations" ("migration", "batch") VALUES ($1, $2)`,
        [m.name, nextBatch],
      );

      await queryRunner.commitTransaction();
      console.log(`  ✓ Completada exitosamente.`);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.error(`  ✕ Error al aplicar la migración ${m.name}:`, err);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
  console.log('=== MIGRACIONES FINALIZADAS CON ÉXITO ===');
}

async function rollback(): Promise<void> {
  console.log('=== INICIANDO REVERSIÓN DE MIGRACIONES (ROLLBACK) ===');
  await setupMigrationTable();

  const migrationRepo = AppDataSource.getRepository(SysMigrationEntity);

  // Obtener el lote máximo
  const maxBatchResult = await migrationRepo
    .createQueryBuilder('m')
    .select('MAX(m.batch)', 'max')
    .getRawOne<{ max: number | null }>();

  const targetBatch = maxBatchResult?.max;

  if (targetBatch === null || targetBatch === undefined || targetBatch === 0) {
    console.log('No hay lotes de migraciones que revertir.');
    return;
  }

  // Obtener todas las migraciones del lote objetivo en orden inverso
  const batchRecords = await migrationRepo.find({
    where: { batch: targetBatch },
    order: { id: 'DESC' },
  });

  console.log(
    `Revirtiendo ${batchRecords.length} migración(es) del Lote #${targetBatch}...`,
  );

  for (const r of batchRecords) {
    const customMig = customMigrations.find((m) => m.name === r.migration);

    if (!customMig) {
      console.warn(
        `[ADVERTENCIA] No se encontró el código físico para la migración "${r.migration}". Se omitirá la reversión SQL de esta migración.`,
      );
      // Solo removemos el registro
      const queryRunner = AppDataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        await queryRunner.query(
          `DELETE FROM "sys_migrations" WHERE "id" = $1`,
          [r.id],
        );
        await queryRunner.commitTransaction();
        console.log(`  ✓ Registro "${r.migration}" eliminado.`);
      } catch (err) {
        await queryRunner.rollbackTransaction();
        throw err;
      } finally {
        await queryRunner.release();
      }
      continue;
    }

    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      console.log(`> Revirtiendo: ${r.migration}`);
      await customMig.down(queryRunner);

      // Remover el registro de sys_migrations
      await queryRunner.query(`DELETE FROM "sys_migrations" WHERE "id" = $1`, [
        r.id,
      ]);

      await queryRunner.commitTransaction();
      console.log(`  ✓ Revertida exitosamente.`);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      console.error(`  ✕ Error al revertir la migración ${r.migration}:`, err);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  console.log('=== REVERSIÓN FINALIZADA CON ÉXITO ===');
}

async function rollbackOne(name: string): Promise<void> {
  console.log(`=== REVERSIÓN INDIVIDUAL DE MIGRACIÓN: ${name} ===`);
  await setupMigrationTable();

  const migrationRepo = AppDataSource.getRepository(SysMigrationEntity);
  const record = await migrationRepo.findOne({ where: { migration: name } });

  if (!record) {
    console.error(
      `Error: La migración "${name}" no ha sido ejecutada en la base de datos.`,
    );
    process.exit(1);
  }

  const customMig = customMigrations.find((m) => m.name === name);

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    if (customMig) {
      console.log(`> Revirtiendo SQL de: ${name}`);
      await customMig.down(queryRunner);
    } else {
      console.warn(
        `[ADVERTENCIA] No se encontró el código físico para la migración "${name}". Solo se removerá el registro de la base de datos.`,
      );
    }

    // Eliminar el registro
    await queryRunner.query(
      `DELETE FROM "sys_migrations" WHERE "migration" = $1`,
      [name],
    );

    await queryRunner.commitTransaction();
    console.log(
      `  ✓ Migración "${name}" revertida y eliminada de sys_migrations.`,
    );
  } catch (err) {
    await queryRunner.rollbackTransaction();
    console.error(`  ✕ Error al revertir la migración ${name}:`, err);
    throw err;
  } finally {
    await queryRunner.release();
  }
}

async function status(): Promise<void> {
  console.log('=== ESTADO DE MIGRACIONES ===');
  await setupMigrationTable();

  const migrationRepo = AppDataSource.getRepository(SysMigrationEntity);
  const executedRecords = await migrationRepo.find();
  const executedMap = new Map<string, { batch: number; executedAt: string }>(
    executedRecords.map((r) => [
      r.migration,
      { batch: r.batch, executedAt: new Date(r.executedAt).toISOString() },
    ]),
  );

  console.log(
    '------------------------------------------------------------------------------------------------',
  );
  console.log(
    `${String('Nombre de la Migración').padEnd(45)} | ${String('Estado').padEnd(15)} | ${String('Lote').padEnd(6)} | Fecha de Ejecución`,
  );
  console.log(
    '------------------------------------------------------------------------------------------------',
  );

  for (const m of customMigrations) {
    const executed = executedMap.get(m.name);
    const nameCol = m.name.padEnd(45);
    if (executed) {
      const statusCol = '\x1b[32mAplicada\x1b[0m'.padEnd(24); // Verde en consola
      const batchCol = String(executed.batch).padEnd(6);
      const dateCol = executed.executedAt;
      console.log(`${nameCol} | ${statusCol} | ${batchCol} | ${dateCol}`);
    } else {
      const statusCol = '\x1b[33mPendiente\x1b[0m'.padEnd(25); // Amarillo en consola
      const batchCol = '-'.padEnd(6);
      const dateCol = '-';
      console.log(`${nameCol} | ${statusCol} | ${batchCol} | ${dateCol}`);
    }
  }

  // Mostrar las que están en DB pero no físicamente en el index (Huérfanas)
  const customSet = new Set(customMigrations.map((m) => m.name));
  for (const r of executedRecords) {
    if (!customSet.has(r.migration)) {
      const nameCol = `\x1b[31m${r.migration} (Huérfana)\x1b[0m`.padEnd(54);
      const statusCol = '\x1b[32mAplicada\x1b[0m'.padEnd(24);
      const batchCol = String(r.batch).padEnd(6);
      const dateCol = new Date(r.executedAt).toISOString();
      console.log(`${nameCol} | ${statusCol} | ${batchCol} | ${dateCol}`);
    }
  }

  console.log(
    '------------------------------------------------------------------------------------------------',
  );
}

async function run(): Promise<void> {
  const args = process.argv.slice(2);
  const actionArg = args.find((a) => a.startsWith('--action='));
  const action = actionArg ? actionArg.split('=')[1] : 'migrate';

  const nameArg = args.find((a) => a.startsWith('--name='));
  const targetName = nameArg ? nameArg.split('=')[1] : '';

  try {
    await AppDataSource.initialize();

    if (action === 'rollback') {
      await rollback();
    } else if (action === 'rollback-one') {
      if (!targetName) {
        console.error(
          'Error: Debes especificar el nombre de la migración con --name=[nombre]',
        );
        process.exit(1);
      }
      await rollbackOne(targetName);
    } else if (action === 'status') {
      await status();
    } else {
      await migrate();
    }
  } catch (err) {
    console.error('Error durante la ejecución de migraciones:', err);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

void run();
