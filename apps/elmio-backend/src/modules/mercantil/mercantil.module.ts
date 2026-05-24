import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MercantilController } from './infrastructure/http/controllers/mercantil.controller';
import { MercantilService } from './application/services/mercantil.service';
import { MercantilStorageService } from './application/services/mercantil-storage.service';
import { BucketModule } from '../bucket/bucket.module';
import { MercantilClientEntity } from './infrastructure/persistence/entities/mercantil-client.entity';
import { MercantilPaymentQuoteEntity } from './infrastructure/persistence/entities/mercantil-payment-quote.entity';
import { MercantilPaymentEntity } from './infrastructure/persistence/entities/mercantil-payment.entity';
import { MercantilPolicyEntity } from './infrastructure/persistence/entities/mercantil-policy.entity';
import { MercantilPaymentTraceEntity } from './infrastructure/persistence/entities/mercantil-payment-trace.entity';
import { MercantilVehicleEntity } from './infrastructure/persistence/entities/mercantil-vehicle.entity';

@Module({
  imports: [
    BucketModule,
    TypeOrmModule.forFeature([
      MercantilClientEntity,
      MercantilPaymentQuoteEntity,
      MercantilPaymentEntity,
      MercantilPolicyEntity,
      MercantilPaymentTraceEntity,
      MercantilVehicleEntity,
    ]),
  ],
  controllers: [MercantilController],
  providers: [MercantilService, MercantilStorageService],
  exports: [MercantilService, MercantilStorageService],
})
export class MercantilModule {}
