import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoginUseCase } from './application/login.use-case';
import { RegisterUseCase } from './application/register.use-case';
import { ValidateSessionUseCase } from './application/validate-session.use-case';
import { AUTH_REPOSITORY_PORT } from './domain/ports/auth-repository.port';
import { DbAuthRepositoryService } from './infrastructure/db-auth-repository.service';
import { AuthSeedService } from './infrastructure/auth-seed.service';
import { UserEntity } from './infrastructure/entities/user.entity';
import { AuthGuard } from './presentation/guards/auth.guard';
import { AuthController } from './presentation/http/auth.controller';

/**
 * Modulo de autenticacion y autorizacion del sistema.
 * Provee login, registro, validacion de sesion y guard para endpoints protegidos.
 */
@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    RegisterUseCase,
    ValidateSessionUseCase,
    DbAuthRepositoryService,
    AuthSeedService,
    AuthGuard,
    {
      provide: AUTH_REPOSITORY_PORT,
      useClass: DbAuthRepositoryService,
    },
  ],
  exports: [AuthGuard, ValidateSessionUseCase, AUTH_REPOSITORY_PORT, TypeOrmModule],
})
export class AuthModule {}


