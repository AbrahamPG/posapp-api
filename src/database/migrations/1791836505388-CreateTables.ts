import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTables1791836505388 implements MigrationInterface {
    name = 'CreateTables1791836505388'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."tables_status_enum" AS ENUM('AVAILABLE', 'OCCUPIED')`);
        await queryRunner.query(`CREATE TABLE "tables" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(50) NOT NULL, "capacity" integer NOT NULL, "status" "public"."tables_status_enum" NOT NULL DEFAULT 'AVAILABLE', "tenantId" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_c5c96f273796fd3ba6d3b58a617" UNIQUE ("tenantId", "name"), CONSTRAINT "PK_7cf2aca7af9550742f855d4eb69" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "tables"`);
        await queryRunner.query(`DROP TYPE "public"."tables_status_enum"`);
    }

}
