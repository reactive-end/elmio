import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import {
  GetOrCreateEnterpriseUseCase,
  GetEnterpriseUseCase,
} from './application/get-enterprise.use-case';
import { UpdateEnterpriseUseCase } from './application/save-domiciliation.use-case';
import { CompleteOnboardingUseCase } from './application/complete-onboarding.use-case';
import { ManageCollaboratorsUseCase } from './application/manage-collaborators.use-case';
import { ManageLoanRequestsUseCase } from './application/manage-loan-requests.use-case';
import { GetAccountStatementUseCase } from './application/get-account-statement.use-case';
import { CreateTransactionUseCase } from './application/create-transaction.use-case';
import { ManageContractsUseCase } from './application/manage-contracts.use-case';
import { ManageProfileUseCase } from './application/manage-profile.use-case';
import { ManagePersonBankAccountsUseCase } from './application/manage-person-bank-accounts.use-case';
import { ManageDisburseUseCase } from './application/manage-disburse.use-case';
import { ManagePurchasesUseCase } from './application/manage-purchases.use-case';
import { ExecuteBillingCutoffUseCase } from './application/execute-billing-cutoff.use-case';
import { ENTERPRISE_REPOSITORY_PORT } from './domain/ports/enterprise-repository.port';
import { DbEnterpriseRepositoryService } from './infrastructure/db-enterprise-repository.service';
import { DocumentStorageService } from './infrastructure/document-storage.service';
import { EnterpriseEntity } from './infrastructure/entities/enterprise.entity';
import { PersonProfileEntity } from './infrastructure/entities/person-profile.entity';
import { PersonBankAccountEntity } from './infrastructure/entities/person-bank-account.entity';
import { DisbursementEntity } from './infrastructure/entities/disbursement.entity';
import { PurchaseEntity } from './infrastructure/entities/purchase.entity';
import { LoanRequestEntity } from './infrastructure/entities/loan-request.entity';
import { TransactionEntity } from './infrastructure/entities/transaction.entity';
import { PlatformConfigEntity } from './infrastructure/entities/platform-config.entity';
import { ContractEntity } from './infrastructure/entities/contract.entity';
import { ContractFileEntity } from './infrastructure/entities/contract-file.entity';
import { EnterpriseController } from './presentation/http/enterprise.controller';
import { ProfileController } from './presentation/http/profile.controller';
import { EnterpriseInterestConfigEntity } from '../enterprise-interest-config/infrastructure/entities/enterprise-interest-config.entity';
import { MercantilModule } from '../mercantil/mercantil.module';
import { PaymentProcessorModule } from '../payment-processor/payment-processor.module';
import { ProductModule } from '../product/product.module';

/**
 * Modulo empresarial: onboarding, colaboradores, solicitudes y estado de cuenta.
 * Importa AuthModule para reutilizar AuthGuard y ValidateSessionUseCase.
 */
@Module({
  imports: [
    AuthModule,
    MercantilModule,
    PaymentProcessorModule,
    ProductModule,
    TypeOrmModule.forFeature([
      EnterpriseEntity,
      PersonProfileEntity,
      PersonBankAccountEntity,
      DisbursementEntity,
      LoanRequestEntity,
      TransactionEntity,
      PlatformConfigEntity,
      ContractEntity,
      ContractFileEntity,
      EnterpriseInterestConfigEntity,
      PurchaseEntity,
    ]),
  ],
  controllers: [EnterpriseController, ProfileController],
  providers: [
    GetOrCreateEnterpriseUseCase,
    GetEnterpriseUseCase,
    UpdateEnterpriseUseCase,
    CompleteOnboardingUseCase,
    ManageCollaboratorsUseCase,
    ManageLoanRequestsUseCase,
    GetAccountStatementUseCase,
    CreateTransactionUseCase,
    ManageContractsUseCase,
    ManageProfileUseCase,
    ManagePersonBankAccountsUseCase,
    ManageDisburseUseCase,
    ManagePurchasesUseCase,
    ExecuteBillingCutoffUseCase,
    DbEnterpriseRepositoryService,
    DocumentStorageService,
    {
      provide: ENTERPRISE_REPOSITORY_PORT,
      useClass: DbEnterpriseRepositoryService,
    },
  ],
  exports: [DocumentStorageService],
})
export class EnterpriseModule {}
