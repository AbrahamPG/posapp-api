
import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddKitchenDispatches1792629951471
  implements MigrationInterface
{
  name = 'AddKitchenDispatches1792629951471';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Liberar la restricción que permitía un solo ticket por cuenta.
    await queryRunner.query(`
      ALTER TABLE "kitchen_orders"
      DROP CONSTRAINT "UQ_dc8b4d08c1037222d245b435607"
    `);

    // 2. Crear la tabla que relaciona cada ticket con sus líneas.
    await queryRunner.query(`
      CREATE TABLE "kitchen_order_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tenantId" character varying NOT NULL,
        "kitchenOrderId" uuid NOT NULL,
        "orderItemId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),

        CONSTRAINT "PK_f0934ba5ddd0272b64f896cf34b"
        PRIMARY KEY ("id"),

        CONSTRAINT "UQ_53481cd030eb15abcfbc9bc936c"
        UNIQUE ("tenantId", "orderItemId")
      )
    `);

    // 3. Añadir temporalmente dispatchNumber como nullable.
    // Así podemos rellenar las filas que ya existen.
    await queryRunner.query(`
      ALTER TABLE "kitchen_orders"
      ADD COLUMN "dispatchNumber" integer
    `);

    // 4. Los tickets históricos serán el primer envío de su cuenta.
    await queryRunner.query(`
      UPDATE "kitchen_orders"
      SET "dispatchNumber" = 1
      WHERE "dispatchNumber" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "kitchen_orders"
      ALTER COLUMN "dispatchNumber" SET NOT NULL
    `);

    // 5. Asociar las líneas existentes a su ticket histórico.
    // La estructura antigua no guardaba qué líneas se enviaron
    // originalmente; por eso asociamos todas las líneas actuales.
    // 5. Asociar las líneas existentes a su ticket histórico.
    await queryRunner.query(`
    INSERT INTO "kitchen_order_items" (
        "tenantId",
        "kitchenOrderId",
        "orderItemId"
    )
    SELECT
        kitchen."tenantId",
        kitchen."id",
        item."id"
    FROM "kitchen_orders" AS kitchen
    INNER JOIN "order_items" AS item
        ON item."orderId" = kitchen."orderId"
    AND item."tenantId" = kitchen."tenantId"
    `);

    // 6. Permitir varios tickets por cuenta, numerados de forma única.
    await queryRunner.query(`
      ALTER TABLE "kitchen_orders"
      ADD CONSTRAINT "UQ_971145d1e9716ebe9871bce4093"
      UNIQUE ("tenantId", "orderId", "dispatchNumber")
    `);

    // 7. Crear las claves foráneas.
    await queryRunner.query(`
      ALTER TABLE "kitchen_order_items"
      ADD CONSTRAINT "FK_7f761f88de36245d75402fe756c"
      FOREIGN KEY ("kitchenOrderId")
      REFERENCES "kitchen_orders"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "kitchen_order_items"
      ADD CONSTRAINT "FK_906948f718e219d81a3abfa4d36"
      FOREIGN KEY ("orderItemId")
      REFERENCES "order_items"("id")
      ON DELETE RESTRICT
      ON UPDATE NO ACTION
    `);
  }

    public async down(queryRunner: QueryRunner): Promise<void> {
    // No revertir si ya existen varias tandas en una misma cuenta.
    const multipleDispatches = await queryRunner.query(`
        SELECT "tenantId", "orderId"
        FROM "kitchen_orders"
        GROUP BY "tenantId", "orderId"
        HAVING COUNT(*) > 1
        LIMIT 1
    `);

    if (multipleDispatches.length > 0) {
        throw new Error(
        'No se puede revertir: existen cuentas con varios tickets de cocina.',
        );
    }

    await queryRunner.query(`
        ALTER TABLE "kitchen_order_items"
        DROP CONSTRAINT "FK_906948f718e219d81a3abfa4d36"
    `);

    await queryRunner.query(`
        ALTER TABLE "kitchen_order_items"
        DROP CONSTRAINT "FK_7f761f88de36245d75402fe756c"
    `);

    await queryRunner.query(`
        ALTER TABLE "kitchen_orders"
        DROP CONSTRAINT "UQ_971145d1e9716ebe9871bce4093"
    `);

    await queryRunner.query(`
        ALTER TABLE "kitchen_orders"
        DROP COLUMN "dispatchNumber"
    `);

    await queryRunner.query(`
        DROP TABLE "kitchen_order_items"
    `);

    await queryRunner.query(`
        ALTER TABLE "kitchen_orders"
        ADD CONSTRAINT "UQ_dc8b4d08c1037222d245b435607"
        UNIQUE ("tenantId", "orderId")
    `);
    }
}
