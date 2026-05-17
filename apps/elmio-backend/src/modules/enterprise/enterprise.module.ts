import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import {
  GetOrCreateEnterpriseUseCase,
  GetEnterpriseUseCase,
} from './application/get-enterprise.use-case';
import { SaveDomiciliationUseCase } from './application/save-domiciliation.use-case';
import { CompleteOnboardingUseCase } from './application/complete-onboarding.use-case';
import { ManageCollaboratorsUseCase } from './application/manage-collaborators.use-case';
import { ManageLoanRequestsUseCase } from './application/manage-loan-requests.use-case';
import { GetAccountStatementUseCase } from './application/get-account-statement.use-case';
import { ENTERPRISE_REPOSITORY_PORT } from './domain/ports/enterprise-repository.port';
import { FileEnterpriseRepositoryService } from './infrastructure/file-enterprise-repository.service';
import { EnterpriseController } from './presentation/http/enterprise.controller';

/**
 * Modulo empresarial: onboarding, colaboradores, solicitudes y estado de cuenta.
 * Importa AuthModule para reutilizar AuthGuard y ValidateSessionUseCase.
 */
@Module({
  imports: [AuthModule],
  controllers: [EnterpriseController],
  providers: [
    GetOrCreateEnterpriseUseCase,
    GetEnterpriseUseCase,
    SaveDomiciliationUseCase,
    CompleteOnboardingUseCase,
    ManageCollaboratorsUseCase,
    ManageLoanRequestsUseCase,
    GetAccountStatementUseCase,
    FileEnterpriseRepositoryService,
    {
      provide: ENTERPRISE_REPOSITORY_PORT,
      useExisting: FileEnterpriseRepositoryService,
    },
  ],
})
export class EnterpriseModule {}
