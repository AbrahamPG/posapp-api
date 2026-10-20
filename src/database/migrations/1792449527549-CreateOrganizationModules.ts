
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrganizationModules1792449527549
  implements MigrationInterface
{
  name = 'CreateOrganizationModules1792449527549';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "organization_modules" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" text NOT NULL,
        "moduleKey" character varying(30) NOT NULL,
        "isEnabled" boolean NOT NULL DEFAULT true,
        "startsAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "expiresAt" TIMESTAMP WITH TIME ZONE,
        "activatedBy" text,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

        CONSTRAINT "PK_organization_modules"
          PRIMARY KEY ("id"),

        CONSTRAINT "FK_organization_modules_organization"
          FOREIGN KEY ("tenantId")
          REFERENCES "organization"("id")
          ON DELETE CASCADE,

        CONSTRAINT "CHK_organization_modules_module_key"
          CHECK ("moduleKey" IN ('catalog', 'pos'))
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "UQ_organization_modules_tenant_module"
      ON "organization_modules" ("tenantId", "moduleKey")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE "organization_modules"
    `);
  }
}
