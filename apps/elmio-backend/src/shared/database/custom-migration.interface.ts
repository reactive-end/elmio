import { QueryRunner } from 'typeorm';

export interface CustomMigration {
  name: string;
  up(queryRunner: QueryRunner): Promise<void>;
  down(queryRunner: QueryRunner): Promise<void>;
}
