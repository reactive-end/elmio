import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { IntegrationApiKeysService } from './application/integration-api-keys.service';
import { IntegrationApiKeyEntity } from './infrastructure/entities/integration-api-key.entity';
import { IntegrationApiKeysAdminController } from './presentation/http/integration-api-keys-admin.controller';

/**
 * Modulo de administracion de API keys por banco e integracion.
 */
@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([IntegrationApiKeyEntity])],
  controllers: [IntegrationApiKeysAdminController],
  providers: [IntegrationApiKeysService],
  exports: [IntegrationApiKeysService],
})
export class IntegrationApiKeysModule {}
