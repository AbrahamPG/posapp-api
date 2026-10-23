
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
  Unique,
  UpdateDateColumn,
} from "typeorm";

import { RestaurantOrder } from "../restaurant-orders/restaurant-order.entity.js";

export enum TableStatus {
  AVAILABLE = "AVAILABLE",
  OCCUPIED = "OCCUPIED",
}
@Entity("tables")
@Unique(["tenantId", "name"])
export class Table {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 50 })
  name: string;

  @Column({ type: "integer" })
  capacity: number;

  @Column({
    type: "enum",
    enum: TableStatus,
    default: TableStatus.AVAILABLE,
  })
  status: TableStatus;

  @Column()
  tenantId: string;

  @OneToMany(
    () => RestaurantOrder,
    (restaurantOrder) => restaurantOrder.table,
  )
  restaurantOrders: Relation<RestaurantOrder[]>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
