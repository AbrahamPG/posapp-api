import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Category } from "./category.entity.js";
import { CategoryService } from "./category.service.js";
import { CategoryController } from "./category.controller.js";
import { Product } from "../products/product.entity.js";






@Module({
    imports:[
        TypeOrmModule.forFeature([Category, Product])
    ],
    controllers:[
        CategoryController
    ],
    providers:[
        CategoryService
    ]
})
export class CategoryModule{}