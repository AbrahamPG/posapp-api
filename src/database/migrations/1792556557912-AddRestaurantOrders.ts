import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey, TableUnique } from "typeorm";

export class AddRestaurantOrders1792556557912 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'restaurant_orders',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'tenantId',
            type: 'character varying',
            isNullable: false,
          },
          {
            name: 'orderId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'tableId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp without time zone',
            default: 'now()',
            isNullable: false,
          },
        ],
        uniques: [
          new TableUnique({
            name: 'UQ_restaurant_orders_tenant_order',
            columnNames: ['tenantId', 'orderId'],
          }),
        ],
      }),
      true,
    );

    await queryRunner.createForeignKeys('restaurant_orders', [
      new TableForeignKey({
        name: 'FK_restaurant_orders_order',
        columnNames: ['orderId'],
        referencedTableName: 'orders',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
      new TableForeignKey({
        name: 'FK_restaurant_orders_table',
        columnNames: ['tableId'],
        referencedTableName: 'tables',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    ]);

    // Preservar las asociaciones existentes antes de quitar tableId.
    await queryRunner.query(`
      INSERT INTO "restaurant_orders" (
        "tenantId",
        "orderId",
        "tableId"
      )
      SELECT
        o."tenantId",
        o."id",
        o."tableId"
      FROM "orders" o
      WHERE o."tableId" IS NOT NULL
    `);

    // Eliminar la FK antigua de orders.tableId sin asumir su nombre.
    await queryRunner.query(`
      DO $$
      DECLARE
        constraint_name text;
      BEGIN
        SELECT c.conname
        INTO constraint_name
        FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        JOIN pg_attribute a
          ON a.attrelid = t.oid
         AND a.attnum = ANY(c.conkey)
        WHERE t.relname = 'orders'
          AND c.contype = 'f'
          AND a.attname = 'tableId'
        LIMIT 1;

        IF constraint_name IS NOT NULL THEN
          EXECUTE format(
            'ALTER TABLE orders DROP CONSTRAINT %I',
            constraint_name
          );
        END IF;
      END $$;
    `);

    await queryRunner.dropColumn('orders', 'tableId');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
  'orders',
  new TableColumn({
    name: 'tableId',
    type: 'uuid',
    isNullable: true,
  }),
);

    // Restaurar las asociaciones originales.
    await queryRunner.query(`
      UPDATE "orders" o
      SET "tableId" = ro."tableId"
      FROM "restaurant_orders" ro
      WHERE ro."orderId" = o."id"
        AND ro."tenantId" = o."tenantId"
    `);

    await queryRunner.createForeignKey(
      'orders',
      new TableForeignKey({
        name: 'FK_orders_tableId',
        columnNames: ['tableId'],
        referencedTableName: 'tables',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.dropTable('restaurant_orders');
  }

}
