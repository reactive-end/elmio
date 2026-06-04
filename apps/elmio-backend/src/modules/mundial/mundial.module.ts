import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MundialController } from './infrastructure/http/controllers/mundial.controller';
import { MundialService } from './application/services/mundial.service';
import { MundialStorageService } from './application/services/mundial-storage.service';
import { BucketModule } from '../bucket/bucket.module';
import { IntegrationApiKeysModule } from '../integration-api-keys/integration-api-keys.module';
import { InsuranceOrderEntity } from '../mercantil/infrastructure/persistence/entities/insurance-order.entity';
import { InsurancePaymentTraceEntity } from '../mercantil/infrastructure/persistence/entities/insurance-payment-trace.entity';

@Module({
  imports: [
    BucketModule,
    IntegrationApiKeysModule,
    TypeOrmModule.forFeature([
      InsuranceOrderEntity,
      InsurancePaymentTraceEntity,
    ]),
  ],
  controllers: [MundialController],
  providers: [MundialService, MundialStorageService],
  exports: [MundialService, MundialStorageService],
})
export class MundialModule {}
