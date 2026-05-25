import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MercantilController } from './infrastructure/http/controllers/mercantil.controller';
import { MercantilService } from './application/services/mercantil.service';
import { MercantilStorageService } from './application/services/mercantil-storage.service';
import { BucketModule } from '../bucket/bucket.module';
import { IntegrationApiKeysModule } from '../integration-api-keys/integration-api-keys.module';
import { InsuranceOrderEntity } from './infrastructure/persistence/entities/insurance-order.entity';
import { InsurancePaymentTraceEntity } from './infrastructure/persistence/entities/insurance-payment-trace.entity';

@Module({
  imports: [
    BucketModule,
    IntegrationApiKeysModule,
    TypeOrmModule.forFeature([
      InsuranceOrderEntity,
      InsurancePaymentTraceEntity,
    ]),
  ],
  controllers: [MercantilController],
  providers: [MercantilService, MercantilStorageService],
  exports: [MercantilService, MercantilStorageService],
})
export class MercantilModule {}
