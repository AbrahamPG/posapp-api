
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { OrderItem } from './order-item.entity.js';

export enum OrderStatus {
  PENDING_CONFIRMATION = 'PENDING_CONFIRMATION',
  OPEN = 'OPEN',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

@Entity('orders')
@Unique(['tenantId', 'idempotencyKey'])
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.OPEN,
  })
  status: OrderStatus;

  @Column({ type: 'integer', default: 0 })
  totalCents: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  idempotencyKey: string | null;

  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true,
  })
  items: Relation<OrderItem[]>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
