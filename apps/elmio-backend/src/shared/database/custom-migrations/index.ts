import { CustomMigration } from '../custom-migration.interface';
import { AddActionsToProductsMigration } from './0001_add_actions_to_products';
import { AddFinancingAndLegalRepsMigration } from './0002_add_financing_and_legal_reps';
import { AddAlternativeBankAccountAndActionsToProductsMigration } from './0003_add_alternative_bank_account_and_actions_to_products';
import { MakeTransactionEnterpriseIdNullableMigration } from './0004_make_transaction_enterprise_id_nullable';
import { AddRoleToBankAccountMigration } from './0005_add_role_to_bank_account';
import { CreatePersonBankAccountsMigration } from './0006_create_person_bank_accounts';
import { CreateDisbursementTableMigration } from './0007_create_disbursement_table';
import { AddProductIdToLoanRequestsMigration } from './0008_add_product_id_to_loan_requests';

export const customMigrations: CustomMigration[] = [
  new AddActionsToProductsMigration(),
  new AddFinancingAndLegalRepsMigration(),
  new AddAlternativeBankAccountAndActionsToProductsMigration(),
  new MakeTransactionEnterpriseIdNullableMigration(),
  new AddRoleToBankAccountMigration(),
  new CreatePersonBankAccountsMigration(),
  new CreateDisbursementTableMigration(),
  new AddProductIdToLoanRequestsMigration(),
];



