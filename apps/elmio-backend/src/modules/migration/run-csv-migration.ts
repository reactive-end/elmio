import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { MigrationController } from './presentation/http/migration.controller';
import { Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';

async function bootstrap() {
  // Cargar variables de entorno si estamos corriendo como script local
  dotenv.config();

  const logger = new Logger('CsvMigrationCli');
  logger.log('Iniciando contexto de aplicación NestJS para migración CLI...');

  // Levantar aplicación en modo standalone (sin puerto HTTP)
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const migrationController = app.get(MigrationController);
    logger.log('Ejecutando migración...');
    const result = await migrationController.runMigration();
    logger.log(
      'Migración completada con éxito:',
      JSON.stringify(result, null, 2),
    );
  } catch (error) {
    logger.error('Error durante la migración CLI:', error);
    process.exit(1);
  } finally {
    await app.close();
    logger.log('Contexto de aplicación cerrado.');
  }
}

void bootstrap();
