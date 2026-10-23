
import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProductCatalogFields1792461868684
  implements MigrationInterface
{
  name = "AddProductCatalogFields1792461868684";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
      ADD "description" text
    `);

    await queryRunner.query(`
      ALTER TABLE "products"
      ADD "imageUrl" character varying(500)
    `);

    await queryRunner.query(`
      ALTER TABLE "products"
      ADD "isVisibleInCatalog" boolean NOT NULL DEFAULT true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "products"
      DROP COLUMN "isVisibleInCatalog"
    `);

    await queryRunner.query(`
      ALTER TABLE "products"
      DROP COLUMN "imageUrl"
    `);

    await queryRunner.query(`
      ALTER TABLE "products"
      DROP COLUMN "description"
    `);
  }
}
