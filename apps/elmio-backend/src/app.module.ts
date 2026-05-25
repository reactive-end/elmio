import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { EnterpriseModule } from './modules/enterprise/enterprise.module';
import { GalleryModule } from './modules/gallery/gallery.module';
import { HealthModule } from './modules/health/health.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';
import { ProductModule } from './modules/product/product.module';
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';
import { NotificationModule } from './modules/notification/notification.module';
import { PasswordRecoveryModule } from './modules/password-recovery/password-recovery.module';
import { BucketModule } from './modules/bucket/bucket.module';
import { MercantilModule } from './modules/mercantil/mercantil.module';
import { PaymentProcessorModule } from './modules/payment-processor/payment-processor.module';
import { IntegrationApiKeysModule } from './modules/integration-api-keys/integration-api-keys.module';
import { EnterpriseInterestConfigModule } from './modules/enterprise-interest-config/enterprise-interest-config.module';

/**
 * Modulo raiz de la aplicacion NestJS.
 * Importa y orquesta todos los modulos de feature y configura la base de datos PostgreSQL de forma asincrona.
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: Number(configService.get<number | string>('DB_PORT', 5432)),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_NAME', 'elmio'),
        schema: configService.get<string>('DB_SCHEMA', 'public'),
        autoLoadEntities: true,
        synchronize: configService.get<boolean>('DB_SYNCHRONIZE', true),
      }),
    }),
    HealthModule,
    AuthModule,
    EnterpriseModule,
    GalleryModule,
    MarketplaceModule,
    ProductModule,
    WhatsAppModule,
    NotificationModule,
    PasswordRecoveryModule,
    BucketModule,
    MercantilModule,
    PaymentProcessorModule,
    IntegrationApiKeysModule,
    EnterpriseInterestConfigModule,
  ],
})
export class AppModule {}
