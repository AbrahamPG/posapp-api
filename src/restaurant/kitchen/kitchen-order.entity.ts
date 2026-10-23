
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { Order } from '../../orders/order.entity.js';
import { KitchenOrderItem } from './kitchen-order-item.entity.js'; 

export enum KitchenOrderStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  READY = 'READY',
  SERVED = 'SERVED',
  CANCELLED = 'CANCELLED',
}

@Entity('kitchen_orders')
@Unique(['tenantId', 'orderId', 'dispatchNumber'])
export class KitchenOrder {
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
  @JoinColumn({ name: 'orderId' })
  order: Relation<Order>;

  @Column({ type: 'integer' })
  dispatchNumber: number;

  @OneToMany(
    () => KitchenOrderItem,
    (item) => item.kitchenOrder,
  )
  items: Relation<KitchenOrderItem[]>;

  @Column({
    type: 'enum',
    enum: KitchenOrderStatus,
    default: KitchenOrderStatus.PENDING,
  })
  status: KitchenOrderStatus;

  @CreateDateColumn()
  sentAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  readyAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  servedAt: Date | null;

  @UpdateDateColumn()
  updatedAt: Date;
}
