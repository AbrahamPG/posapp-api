
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateKitchenOrders1792618327841
  implements MigrationInterface
{
  name = 'CreateKitchenOrders1792618327841';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "public"."kitchen_orders_status_enum"
      AS ENUM (
        'PENDING',
        'PREPARING',
        'READY',
        'SERVED',
        'CANCELLED'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "kitchen_orders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" character varying NOT NULL,
        "orderId" uuid NOT NULL,
        "status" "public"."kitchen_orders_status_enum"
          NOT NULL DEFAULT 'PENDING',
        "sentAt" TIMESTAMP NOT NULL DEFAULT now(),
        "readyAt" TIMESTAMP WITH TIME ZONE,
        "servedAt" TIMESTAMP WITH TIME ZONE,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),

        CONSTRAINT "PK_0f2d28a9bc01ec39f13f7b6cae4"
          PRIMARY KEY ("id"),

        CONSTRAINT "UQ_dc8b4d08c1037222d245b435607"
          UNIQUE ("tenantId", "orderId")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "kitchen_orders"
      ADD CONSTRAINT "FK_77c20a1ee024be4ba7b9813fa07"
      FOREIGN KEY ("orderId")
      REFERENCES "orders"("id")
      ON DELETE RESTRICT
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE "kitchen_orders"
    `);

    await queryRunner.query(`
      DROP TYPE "public"."kitchen_orders_status_enum"
    `);
  }
}
