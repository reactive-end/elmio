import { CustomMigration } from '../custom-migration.interface';
import { AddActionsToProductsMigration } from './0001_add_actions_to_products';

export const customMigrations: CustomMigration[] = [
  new AddActionsToProductsMigration(),
];
