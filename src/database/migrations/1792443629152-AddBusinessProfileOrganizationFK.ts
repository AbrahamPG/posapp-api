
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBusinessProfileOrganizationFK1792443629152
  implements MigrationInterface
{
  name = 'AddBusinessProfileOrganizationFK1792443629152';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "business_profile"
      ADD CONSTRAINT "FK_business_profile_organization"
      FOREIGN KEY ("tenantId")
      REFERENCES "organization"("id")
      ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "business_profile"
      DROP CONSTRAINT "FK_business_profile_organization"
    `);
  }
}
