
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

import { OrderItem } from '../../orders/order-item.entity.js';
import { KitchenOrder } from './kitchen-order.entity.js';

@Entity('kitchen_order_items')
@Unique(['tenantId', 'orderItemId'])
export class KitchenOrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column({ type: 'uuid' })
  kitchenOrderId: string;

  @ManyToOne(
    () => KitchenOrder,
    (kitchenOrder) => kitchenOrder.items,
    {
      nullable: false,
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'kitchenOrderId' })
  kitchenOrder: Relation<KitchenOrder>;

  @Column({ type: 'uuid' })
  orderItemId: string;

  @ManyToOne(() => OrderItem, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'orderItemId' })
  orderItem: Relation<OrderItem>;

  @CreateDateColumn()
  createdAt: Date;
}
