import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PaymentProcessorController } from './presentation/http/payment-processor.controller';
import { PaymentProcessorService } from './application/services/payment-processor.service';
import { PaymentProcessorRepository } from './infrastructure/persistence/payment-processor.repository';
import { PAYMENT_PROCESSOR_REPOSITORY } from './domain/ports/payment-processor-repository.interface';
import { DoneApiKeyGuard } from './presentation/http/done-api-key.guard';
import { AuthModule } from '../auth/auth.module';

import { Payment } from './infrastructure/persistence/entities/payment.entity';
import { BankAccount } from './infrastructure/persistence/entities/bank-account.entity';
import { BankAccountType } from './infrastructure/persistence/entities/bank-account-type.entity';
import { Currency } from './infrastructure/persistence/entities/currency.entity';
import { ApiKey } from './infrastructure/persistence/entities/api-key.entity';
import { ExchangeRate } from './infrastructure/persistence/entities/exchange-rate.entity';
import { Bank } from './infrastructure/persistence/entities/bank.entity';
import { BankPaymentMethod } from './infrastructure/persistence/entities/bank-payment-method.entity';
import { PaymentMethod } from './infrastructure/persistence/entities/payment-method.entity';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    AuthModule,
    TypeOrmModule.forFeature([
      Payment,
      BankAccount,
      BankAccountType,
      Currency,
      ApiKey,
      ExchangeRate,
      Bank,
      BankPaymentMethod,
      PaymentMethod,
    ]),
  ],
  controllers: [PaymentProcessorController],
  providers: [
    DoneApiKeyGuard,
    PaymentProcessorService,
    PaymentProcessorRepository,
    {
      provide: PAYMENT_PROCESSOR_REPOSITORY,
      useExisting: PaymentProcessorRepository,
    },
  ],
  exports: [PaymentProcessorService],
})
export class PaymentProcessorModule {}
