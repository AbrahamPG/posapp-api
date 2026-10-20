import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBusinessProfile1792440820332 implements MigrationInterface {
    name = 'CreateBusinessProfile1792440820332'

    
public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        CREATE TABLE "business_profile" (
            "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
            "tenantId" text NOT NULL,
            "businessType" character varying(50),
            "description" text,
            "address" text,
            "phone" character varying(20),
            "coverImageUrl" text,
            "photos" jsonb NOT NULL DEFAULT '[]'::jsonb,
            "socialLinks" jsonb,
            "openingHours" jsonb,
            "isPublished" boolean NOT NULL DEFAULT false,
            "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
            "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),

            CONSTRAINT "UQ_9f8e742cb00b823651e6bea3827"
                UNIQUE ("tenantId"),

            CONSTRAINT "PK_e71e197c467c1ec2c45a1652110"
                PRIMARY KEY ("id"),

            CONSTRAINT "FK_business_profile_organization"
                FOREIGN KEY ("tenantId")
                REFERENCES "organization"("id")
                ON DELETE CASCADE
        )
    `);
}


    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "business_profile"`);
    }

}
