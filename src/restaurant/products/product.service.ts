import { Injectable, NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";
import { Product } from "./product.entity.js";
import { InjectRepository } from "@nestjs/typeorm";
import { CreateProductDto } from "./dto/create-product.dto.js";
import { Category } from "../categories/category.entity.js";
import { UpdateProductDto } from "./dto/update-product.dto.js";



@Injectable()
export class ProductService{


    constructor(
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
        @InjectRepository(Category)
        private readonly categoryRepository: Repository<Category>
    ){}


    async create(dto:CreateProductDto, tenantId:string){
        const category = await this.categoryRepository.findOne({
            where:{
                id: dto.categoryId,
                tenantId
            }
        })
        if(!category) throw new NotFoundException('Categoria no encontrada')

        const product = this.productRepository.create({
            ...dto,
            tenantId,
            category
        })

        return await this.productRepository.save(product)
    }

    async findAll(tenantId: string) {
    return this.productRepository.find({
        where: {
            tenantId,
            },
        relations: {
            category: true,
            },
        order: {
            name: 'ASC',
            },
    });
    }

    async findOne(id: string, tenantId: string){
        const product = await this.productRepository.findOne({
            where:{
                id,
                tenantId
            },
            relations:{
                category: true
            },
        })
        if(!product) throw new NotFoundException('Producto no encontrado')
        return product
    }

    async update(id:string, dto: UpdateProductDto, tenantId: string){
        const product = await this.findOne(id,tenantId);
        if(dto.categoryId){
            const category = await this.categoryRepository.findOne({
                where:{
                    id: dto.categoryId,
                    tenantId,
                }
            })
            if(!category) throw new NotFoundException('Categoría no encontrada')
            product.category = category;
        }

        Object.assign(product,dto)

        
        return await this.productRepository.save(product)
    }

    async remove(id:string, tenantId:string){
        const product = await this.findOne(id,tenantId)
        await this.productRepository.remove(product)

        return {
            message: 'Producto eliminado correctamente'
        }
    }


}