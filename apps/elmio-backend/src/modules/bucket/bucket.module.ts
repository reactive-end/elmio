/**
 * @fileoverview Módulo de NestJS para gestión de archivos en Google Cloud Storage
 * @description Módulo que agrupa los componentes del bounded context
 * de gestión de archivos del bucket
 * @module bucket
 */

import { Module } from '@nestjs/common';
import { BucketController } from './infrastructure/http/controllers/bucket.controller';
import { BucketService } from './application/services/bucket.service';

/**
 * Módulo de gestión de archivos en el bucket
 * @class BucketModule
 * @description Módulo NestJS que configura:
 * - Servicio de aplicación para Google Cloud Storage
 * - Controlador HTTP con endpoints de archivos
 */
@Module({
  controllers: [BucketController],
  providers: [BucketService],
  exports: [BucketService],
})
export class BucketModule {}
