import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { EnterpriseEntity } from '../enterprise/infrastructure/entities/enterprise.entity';
import { EnterpriseInterestConfigService } from './application/enterprise-interest-config.service';
import { EnterpriseInterestConfigEntity } from './infrastructure/entities/enterprise-interest-config.entity';
import { EnterpriseInterestConfigAdminController } from './presentation/http/enterprise-interest-config-admin.controller';

/**
 * Modulo para administrar la tasa global por empresa.
 */
@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      EnterpriseEntity,
      EnterpriseInterestConfigEntity,
    ]),
  ],
  controllers: [EnterpriseInterestConfigAdminController],
  providers: [EnterpriseInterestConfigService],
  exports: [EnterpriseInterestConfigService],
})
export class EnterpriseInterestConfigModule {}
