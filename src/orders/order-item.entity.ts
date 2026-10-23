import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn, type Relation } from "typeorm";
import { Order } from "./order.entity.js";
import { Product } from "../catalog/products/product.entity.js"; 



@Entity('order_items')
export class OrderItem {

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    tenantId: string

    @ManyToOne(()=>Order,{
        nullable: false,
        onDelete: 'RESTRICT'
    })
    @JoinColumn({name: 'orderId'})
    order: Relation<Order> 
    
    @ManyToOne(()=>Product,{
        nullable: true,
        onDelete: 'SET NULL'
    })
    @JoinColumn({name:'productId'})
    product: Relation<Product>

    @Column({type: 'varchar', length:150})
    productName: string

    @Column({type: 'integer'})
    unitPriceCents: number

    @Column({type: 'integer'})
    quantity: number

    @Column({type:'integer'})
    subtotalCents: number

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}