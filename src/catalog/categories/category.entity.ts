import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from "typeorm";
import { Product } from "../products/product.entity.js";
import type { Relation } from 'typeorm';




@Entity('categories')
@Unique(['tenantId', 'name'])
export class Category{

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({length: 100})
    name: string

    @Column()
    tenantId: string

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date

    @OneToMany(()=>Product, product=>product.category)
    products: Relation<Product[]> 

}