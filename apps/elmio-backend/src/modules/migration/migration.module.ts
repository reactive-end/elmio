import { Module } from '@nestjs/common';
import { MigrationController } from './presentation/http/migration.controller';

@Module({
  controllers: [MigrationController],
})
export class MigrationModule {}
