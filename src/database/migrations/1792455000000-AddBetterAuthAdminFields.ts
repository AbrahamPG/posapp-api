
import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBetterAuthAdminFields1792455000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Campos del plugin admin() en la tabla user.
    await queryRunner.query(`
      ALTER TABLE "user"
      ADD COLUMN "role" TEXT NOT NULL DEFAULT 'user',
      ADD COLUMN "banned" BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN "banReason" TEXT NULL,
      ADD COLUMN "banExpires" TIMESTAMPTZ NULL
    `);

    // Campo del plugin admin() en la tabla session.
    await queryRunner.query(`
      ALTER TABLE "session"
      ADD COLUMN "impersonatedBy" TEXT NULL
    `);

    // Migramos el administrador global existente.
    await queryRunner.query(`
      UPDATE "user"
      SET "role" = 'admin'
      WHERE "platformRole" = 'superAdminFinalBoss'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "session"
      DROP COLUMN "impersonatedBy"
    `);

    await queryRunner.query(`
      ALTER TABLE "user"
      DROP COLUMN "banExpires",
      DROP COLUMN "banReason",
      DROP COLUMN "banned",
      DROP COLUMN "role"
    `);
  }
}
