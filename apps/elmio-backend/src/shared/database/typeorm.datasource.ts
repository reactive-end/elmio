import 'dotenv/config';
import { DataSource } from 'typeorm';

/**
 * DataSource para TypeORM CLI en el nuevo backend unificado.
 * Reutiliza las mismas variables de entorno de NestJS para conectarse
 * a la base de datos y correr/generar migraciones de forma segura.
 *
 * @example
 * npm run migration:generate --name=InitialSchema
 * npm run migration:run
 */
function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(
      `Environment variable ${name} is required for TypeORM DataSource`,
    );
  }
  return v;
}

const isCompiled = __filename.endsWith('.js');

const AppDataSource = new DataSource({
  type: 'postgres',
  host: requiredEnv('DB_HOST'),
  port: Number.parseInt(requiredEnv('DB_PORT'), 10),
  username: requiredEnv('DB_USERNAME'),
  password: requiredEnv('DB_PASSWORD'),
  database: requiredEnv('DB_NAME'),
  schema: requiredEnv('DB_SCHEMA'),
  // Garantizar que public esté en la ruta de búsqueda para que las funciones
  // de extensiones globales como gen_random_uuid() sean visibles.
  extra: {
    options: `-c search_path=${requiredEnv('DB_SCHEMA')},public`,
  },
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  logging:
    process.env.DB_LOGGING === 'true' || process.env.NODE_ENV === 'development',
  entities: isCompiled
    ? ['dist/modules/**/*.entity.js']
    : ['src/modules/**/*.entity.ts'],
  migrations: isCompiled
    ? ['dist/shared/database/migrations/*.js']
    : ['src/shared/database/migrations/*.ts'],
});

export default AppDataSource;
