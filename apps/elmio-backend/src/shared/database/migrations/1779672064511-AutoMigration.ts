import { MigrationInterface, QueryRunner } from "typeorm";

export class AutoMigration1779672064511 implements MigrationInterface {
    name = 'AutoMigration1779672064511'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "enterprise_interest_configs" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "integration_api_keys" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "recovery_codes" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "payments"."exchange_rate" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "payments"."bank_account" DROP CONSTRAINT "FK_4d57ed8a02fef8317e1a3da005c"`);
        await queryRunner.query(`ALTER TABLE "payments"."exchange_rate" DROP CONSTRAINT "FK_9cc0c5ab693ad206273ca2dadb8"`);
        await queryRunner.query(`ALTER TABLE "payments"."payment" DROP CONSTRAINT "FK_0c2788c000c47176b48596cad1a"`);
        await queryRunner.query(`ALTER TABLE "payments"."currency" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "payments"."payment" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "payments"."bank_account" DROP CONSTRAINT "FK_bank_account_account_type_id"`);
        await queryRunner.query(`ALTER TABLE "payments"."bank_account_type" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "payments"."bank_payment_method" DROP CONSTRAINT "FK_77a933c07494f020c902ea48b6a"`);
        await queryRunner.query(`ALTER TABLE "payments"."payment_method" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "payments"."bank_payment_method" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "payments"."bank_payment_method" DROP CONSTRAINT "FK_52c31ec8cd564ab017902490293"`);
        await queryRunner.query(`ALTER TABLE "payments"."bank_account" DROP CONSTRAINT "FK_24569b6843af6bcef189740e99e"`);
        await queryRunner.query(`ALTER TABLE "payments"."bank" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "payments"."api_key" DROP CONSTRAINT "FK_6994d05336196994fbffd5880c8"`);
        await queryRunner.query(`ALTER TABLE "payments"."payment" DROP CONSTRAINT "FK_07b8074031c9aecf2bb568e7ad7"`);
        await queryRunner.query(`ALTER TABLE "payments"."payment" DROP CONSTRAINT "FK_dbfd535cca87acecf5adab80214"`);
        await queryRunner.query(`ALTER TABLE "payments"."bank_account" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "payments"."api_key" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "enterprise_interest_configs" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "integration_api_keys" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "recovery_codes" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "payments"."exchange_rate" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "payments"."currency" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "payments"."payment" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "payments"."bank_account_type" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "payments"."payment_method" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "payments"."bank_payment_method" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "payments"."bank" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "payments"."bank_account" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "payments"."api_key" ALTER COLUMN "id" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "payments"."exchange_rate" ADD CONSTRAINT "FK_9cc0c5ab693ad206273ca2dadb8" FOREIGN KEY ("currency_id") REFERENCES "payments"."currency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments"."payment" ADD CONSTRAINT "FK_dbfd535cca87acecf5adab80214" FOREIGN KEY ("internal_source_account_id") REFERENCES "payments"."bank_account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments"."payment" ADD CONSTRAINT "FK_07b8074031c9aecf2bb568e7ad7" FOREIGN KEY ("internal_dest_account_id") REFERENCES "payments"."bank_account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments"."payment" ADD CONSTRAINT "FK_0c2788c000c47176b48596cad1a" FOREIGN KEY ("currency_id") REFERENCES "payments"."currency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments"."bank_payment_method" ADD CONSTRAINT "FK_52c31ec8cd564ab017902490293" FOREIGN KEY ("bank_id") REFERENCES "payments"."bank"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments"."bank_payment_method" ADD CONSTRAINT "FK_77a933c07494f020c902ea48b6a" FOREIGN KEY ("payment_method_id") REFERENCES "payments"."payment_method"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments"."bank_account" ADD CONSTRAINT "FK_24569b6843af6bcef189740e99e" FOREIGN KEY ("bank_id") REFERENCES "payments"."bank"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments"."bank_account" ADD CONSTRAINT "FK_bank_account_account_type_id" FOREIGN KEY ("account_type_id") REFERENCES "payments"."bank_account_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments"."bank_account" ADD CONSTRAINT "FK_4d57ed8a02fef8317e1a3da005c" FOREIGN KEY ("currency_id") REFERENCES "payments"."currency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments"."api_key" ADD CONSTRAINT "FK_6994d05336196994fbffd5880c8" FOREIGN KEY ("bank_account_id") REFERENCES "payments"."bank_account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments"."api_key" DROP CONSTRAINT "FK_6994d05336196994fbffd5880c8"`);
        await queryRunner.query(`ALTER TABLE "payments"."bank_account" DROP CONSTRAINT "FK_4d57ed8a02fef8317e1a3da005c"`);
        await queryRunner.query(`ALTER TABLE "payments"."bank_account" DROP CONSTRAINT "FK_bank_account_account_type_id"`);
        await queryRunner.query(`ALTER TABLE "payments"."bank_account" DROP CONSTRAINT "FK_24569b6843af6bcef189740e99e"`);
        await queryRunner.query(`ALTER TABLE "payments"."bank_payment_method" DROP CONSTRAINT "FK_77a933c07494f020c902ea48b6a"`);
        await queryRunner.query(`ALTER TABLE "payments"."bank_payment_method" DROP CONSTRAINT "FK_52c31ec8cd564ab017902490293"`);
        await queryRunner.query(`ALTER TABLE "payments"."payment" DROP CONSTRAINT "FK_0c2788c000c47176b48596cad1a"`);
        await queryRunner.query(`ALTER TABLE "payments"."payment" DROP CONSTRAINT "FK_07b8074031c9aecf2bb568e7ad7"`);
        await queryRunner.query(`ALTER TABLE "payments"."payment" DROP CONSTRAINT "FK_dbfd535cca87acecf5adab80214"`);
        await queryRunner.query(`ALTER TABLE "payments"."exchange_rate" DROP CONSTRAINT "FK_9cc0c5ab693ad206273ca2dadb8"`);
        await queryRunner.query(`ALTER TABLE "payments"."api_key" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "payments"."bank_account" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "payments"."bank" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "payments"."bank_payment_method" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "payments"."payment_method" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "payments"."bank_account_type" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "payments"."payment" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "payments"."currency" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "payments"."exchange_rate" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "recovery_codes" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "integration_api_keys" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "enterprise_interest_configs" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "payments"."api_key" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "payments"."bank_account" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "payments"."payment" ADD CONSTRAINT "FK_dbfd535cca87acecf5adab80214" FOREIGN KEY ("internal_source_account_id") REFERENCES "payments"."bank_account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments"."payment" ADD CONSTRAINT "FK_07b8074031c9aecf2bb568e7ad7" FOREIGN KEY ("internal_dest_account_id") REFERENCES "payments"."bank_account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments"."api_key" ADD CONSTRAINT "FK_6994d05336196994fbffd5880c8" FOREIGN KEY ("bank_account_id") REFERENCES "payments"."bank_account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments"."bank" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "payments"."bank_account" ADD CONSTRAINT "FK_24569b6843af6bcef189740e99e" FOREIGN KEY ("bank_id") REFERENCES "payments"."bank"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments"."bank_payment_method" ADD CONSTRAINT "FK_52c31ec8cd564ab017902490293" FOREIGN KEY ("bank_id") REFERENCES "payments"."bank"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments"."bank_payment_method" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "payments"."payment_method" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "payments"."bank_payment_method" ADD CONSTRAINT "FK_77a933c07494f020c902ea48b6a" FOREIGN KEY ("payment_method_id") REFERENCES "payments"."payment_method"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments"."bank_account_type" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "payments"."bank_account" ADD CONSTRAINT "FK_bank_account_account_type_id" FOREIGN KEY ("account_type_id") REFERENCES "payments"."bank_account_type"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments"."payment" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "payments"."currency" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "payments"."payment" ADD CONSTRAINT "FK_0c2788c000c47176b48596cad1a" FOREIGN KEY ("currency_id") REFERENCES "payments"."currency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments"."exchange_rate" ADD CONSTRAINT "FK_9cc0c5ab693ad206273ca2dadb8" FOREIGN KEY ("currency_id") REFERENCES "payments"."currency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments"."bank_account" ADD CONSTRAINT "FK_4d57ed8a02fef8317e1a3da005c" FOREIGN KEY ("currency_id") REFERENCES "payments"."currency"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments"."exchange_rate" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "recovery_codes" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "integration_api_keys" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
        await queryRunner.query(`ALTER TABLE "enterprise_interest_configs" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`);
    }

}
