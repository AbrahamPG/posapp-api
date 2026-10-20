import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, type Relation, Unique, UpdateDateColumn } from "typeorm";
import { Order } from "../orders/order.entity.js";


export enum TableStatus{
    AVAILABLE = 'AVAILABLE',
    OCCUPIED = 'OCCUPIED'
}




@Entity('tables')
@Unique(['tenantId', 'name'])
export class Table{

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({
        length: 50
    })
    name: string

    @Column({
        type: 'integer'
    })
    capacity: number

    @Column({
        type: 'enum',
        enum: TableStatus,
        default: TableStatus.AVAILABLE
    })
    status: TableStatus

    @Column()
    tenantId: string

    @OneToMany(()=> Order, orders => orders.table)
    orders: Relation<Order[]>

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}