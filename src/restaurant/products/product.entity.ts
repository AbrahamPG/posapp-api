import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Category } from "../categories/category.entity.js";
import type { Relation } from "typeorm";


@Entity('products')
export class Product{

    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({length: 150})
    name: string

    @Column({type: "integer"})
    priceCents: number

    @Column({default: false})
    agotado: boolean

    @Column({default: false})
    trackStock: boolean

    @Column()
    tenantId: string

    @ManyToOne(()=>Category,{
        nullable: false,
        onDelete: 'RESTRICT'
    })
    @JoinColumn({name: 'categoryId'})
    category: Relation<Category> 

    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date

}