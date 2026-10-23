import { Module } from "@nestjs/common";
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from "./product.entity.js";
import { ProductService } from "./product.service.js";
import { ProductController } from "./product.controller.js";
import { Category } from "../categories/category.entity.js";



@Module({
    imports: [
        TypeOrmModule.forFeature([
            Product,
            Category
        ])
    ],
    controllers:[
        ProductController
    ],
    providers:[
        ProductService
    ]
})
export class ProductModule{}