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
import { ManageProfileUseCase } from './application/manage-profile.use-case';
import { ENTERPRISE_REPOSITORY_PORT } from './domain/ports/enterprise-repository.port';
import { DbEnterpriseRepositoryService } from './infrastructure/db-enterprise-repository.service';
import { DocumentStorageService } from './infrastructure/document-storage.service';
import { EnterpriseEntity } from './infrastructure/entities/enterprise.entity';
import { PersonProfileEntity } from './infrastructure/entities/person-profile.entity';
import { LoanRequestEntity } from './infrastructure/entities/loan-request.entity';
import { TransactionEntity } from './infrastructure/entities/transaction.entity';
import { PlatformConfigEntity } from './infrastructure/entities/platform-config.entity';
import { EnterpriseController } from './presentation/http/enterprise.controller';
import { ProfileController } from './presentation/http/profile.controller';

/**
 * Modulo empresarial: onboarding, colaboradores, solicitudes y estado de cuenta.
 * Importa AuthModule para reutilizar AuthGuard y ValidateSessionUseCase.
 */
@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      EnterpriseEntity,
      PersonProfileEntity,
      LoanRequestEntity,
      TransactionEntity,
      PlatformConfigEntity,
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
    ManageProfileUseCase,
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


