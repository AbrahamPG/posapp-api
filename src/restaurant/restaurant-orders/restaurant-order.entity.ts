
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
  Unique,
} from 'typeorm';

import { Order } from '../../orders/order.entity.js';
import { Table } from '../tables/table.entity.js';

@Entity('restaurant_orders')
@Unique(['tenantId', 'orderId'])
export class RestaurantOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column({ type: 'uuid' })
  orderId: string;

  @ManyToOne(() => Order, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'orderId',
    foreignKeyConstraintName: 'FK_restaurant_orders_order'
   })
  order: Relation<Order>;

  @Column({ type: 'uuid', nullable: true })
  tableId: string;

  @ManyToOne(() => Table, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'tableId',
    foreignKeyConstraintName: 'FK_restaurant_orders_table',
   })
  table: Relation<Table>;

  @CreateDateColumn()
  createdAt: Date;
}
