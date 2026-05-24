import { MigrationInterface, QueryRunner } from "typeorm";

export class AutoMigration1779628676108 implements MigrationInterface {
    name = 'AutoMigration1779628676108'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "mercantil_vehicles" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "mercantil_policies" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "mercantil_payments" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "mercantil_payment_traces" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "mercantil_payment_quotes" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "mercantil_clients" CASCADE`);
        await queryRunner.query(`CREATE TABLE "insurance_orders" ("id" uuid NOT NULL, "shopcartId" character varying(100) NOT NULL, "provider" character varying(100) NOT NULL, "status" character varying(50) NOT NULL, "clientSnapshot" jsonb, "vehicleSnapshot" jsonb, "policiesSnapshot" jsonb, "paymentSnapshot" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_08947515ff00706b21950bc9b33" UNIQUE ("shopcartId"), CONSTRAINT "PK_de7f9fb4f694e0fbfce96adca93" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "insurance_payment_traces" ("id" uuid NOT NULL, "shopcartId" character varying(100) NOT NULL, "provider" character varying(100) NOT NULL, "stage" character varying(50) NOT NULL, "status" character varying(20) NOT NULL, "message" character varying(500) NOT NULL, "errorCode" character varying(100), "errorStack" text, "payload" jsonb, "response" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d73c2af179154087ea73ab4c547" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_insurance_payment_traces_shopcartId" ON "insurance_payment_traces"  ("shopcartId") `);
        await queryRunner.query(`CREATE INDEX "IDX_insurance_payment_traces_provider" ON "insurance_payment_traces"  ("provider") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_insurance_payment_traces_provider"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_insurance_payment_traces_shopcartId"`);
        await queryRunner.query(`DROP TABLE "insurance_payment_traces"`);
        await queryRunner.query(`DROP TABLE "insurance_orders"`);
    }

}
