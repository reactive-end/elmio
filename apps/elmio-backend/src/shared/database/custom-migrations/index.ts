import { CustomMigration } from '../custom-migration.interface';
import { AddActionsToProductsMigration } from './0001_add_actions_to_products';
import { AddFinancingAndLegalRepsMigration } from './0002_add_financing_and_legal_reps';
import { AddAlternativeBankAccountAndActionsToProductsMigration } from './0003_add_alternative_bank_account_and_actions_to_products';

export const customMigrations: CustomMigration[] = [
  new AddActionsToProductsMigration(),
  new AddFinancingAndLegalRepsMigration(),
  new AddAlternativeBankAccountAndActionsToProductsMigration(),
];


