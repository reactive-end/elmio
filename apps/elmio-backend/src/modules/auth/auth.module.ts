import { Module } from '@nestjs/common';
import { LoginUseCase } from './application/login.use-case';
import { RegisterUseCase } from './application/register.use-case';
import { ValidateSessionUseCase } from './application/validate-session.use-case';
import { AUTH_REPOSITORY_PORT } from './domain/ports/auth-repository.port';
import { FileAuthRepositoryService } from './infrastructure/file-auth-repository.service';
import { AuthGuard } from './presentation/guards/auth.guard';
import { AuthController } from './presentation/http/auth.controller';

/**
 * Modulo de autenticacion y autorizacion del sistema.
 * Provee login, registro, validacion de sesion y guard para endpoints protegidos.
 */
@Module({
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    RegisterUseCase,
    ValidateSessionUseCase,
    FileAuthRepositoryService,
    AuthGuard,
    {
      provide: AUTH_REPOSITORY_PORT,
      useExisting: FileAuthRepositoryService,
    },
  ],
  exports: [AuthGuard, ValidateSessionUseCase, AUTH_REPOSITORY_PORT],
})
export class AuthModule {}
