import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPlatformRoleToUser1792452323703 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user"
      ADD COLUMN "platformRole" VARCHAR(30) NOT NULL DEFAULT 'user'
    `);

    await queryRunner.query(`
      ALTER TABLE "user"
      ADD CONSTRAINT "CHK_user_platform_role"
      CHECK ("platformRole" IN ('user', 'superAdminFinalBoss'))
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user"
      DROP CONSTRAINT "CHK_user_platform_role"
    `);

    await queryRunner.query(`
      ALTER TABLE "user"
      DROP COLUMN "platformRole"
    `);
  }

}
