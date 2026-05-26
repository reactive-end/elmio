import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoginUseCase } from './application/login.use-case';
import { DiscoverProfilesUseCase } from './application/discover-profiles.use-case';
import { RegisterUseCase } from './application/register.use-case';
import { ChangePasswordUseCase } from './application/change-password.use-case';
import { ValidateSessionUseCase } from './application/validate-session.use-case';
import { AUTH_REPOSITORY_PORT } from './domain/ports/auth-repository.port';
import { DbAuthRepositoryService } from './infrastructure/db-auth-repository.service';
import { AuthSeedService } from './infrastructure/auth-seed.service';
import { UserEntity } from './infrastructure/entities/user.entity';
import { AuthGuard } from './presentation/guards/auth.guard';
import { OptionalAuthGuard } from './presentation/guards/optional-auth.guard';
import { RolesGuard } from './presentation/guards/roles.guard';
import { AuthController } from './presentation/http/auth.controller';
import { AlliesAdminController } from './presentation/http/allies-admin.controller';

/**
 * Modulo de autenticacion y autorizacion del sistema.
 * Provee login, registro, validacion de sesion y guard para endpoints protegidos.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>(
          'JWT_SECRET',
          'supersecrettokenkeyforjwt',
        ),
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  controllers: [AuthController, AlliesAdminController],
  providers: [
    LoginUseCase,
    DiscoverProfilesUseCase,
    RegisterUseCase,
    ChangePasswordUseCase,
    ValidateSessionUseCase,
    DbAuthRepositoryService,
    AuthSeedService,
    AuthGuard,
    OptionalAuthGuard,
    RolesGuard,
    {
      provide: AUTH_REPOSITORY_PORT,
      useClass: DbAuthRepositoryService,
    },
  ],
  exports: [
    AuthGuard,
    OptionalAuthGuard,
    RolesGuard,
    ValidateSessionUseCase,
    AUTH_REPOSITORY_PORT,
    TypeOrmModule,
    JwtModule,
  ],
})
export class AuthModule {}
