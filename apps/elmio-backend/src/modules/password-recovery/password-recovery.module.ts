import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { NotificationModule } from '../notification/notification.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { RecoveryCodeEntity } from './infrastructure/entities/recovery-code.entity';
import { TypeOrmRecoveryCodeRepository } from './infrastructure/repositories/typeorm-recovery-code.repository';
import { RECOVERY_CODE_REPOSITORY_PORT } from './domain/ports/recovery-code-repository.port';
import { RequestRecoveryUseCase } from './application/request-recovery.use-case';
import { VerifyCodeUseCase } from './application/verify-code.use-case';
import { ResetPasswordUseCase } from './application/reset-password.use-case';
import { CheckRecoveryAvailabilityUseCase } from './application/check-recovery-availability.use-case';
import { PasswordRecoveryController } from './presentation/password-recovery.controller';

/**
 * Modulo de recuperacion de contrasenas.
 * Orquesta la logica para solicitar codigos OTP, verificarlos y
 * restablecer contrasenas de forma segura.
 */
@Module({
  imports: [
    AuthModule,
    NotificationModule,
    WhatsAppModule,
    TypeOrmModule.forFeature([RecoveryCodeEntity]),
  ],
  controllers: [PasswordRecoveryController],
  providers: [
    RequestRecoveryUseCase,
    VerifyCodeUseCase,
    ResetPasswordUseCase,
    CheckRecoveryAvailabilityUseCase,
    {
      provide: RECOVERY_CODE_REPOSITORY_PORT,
      useClass: TypeOrmRecoveryCodeRepository,
    },
  ],
})
export class PasswordRecoveryModule {}
