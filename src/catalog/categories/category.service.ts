import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";
import { Category } from "./category.entity.js";
import { InjectRepository } from "@nestjs/typeorm";
import { CreateCategoryDto } from "./dto/create-category.dto.js";
import { UpdateCategoryDto } from "./dto/update-category.dto.js";
import { Product } from "../products/product.entity.js";



@Injectable()
export class CategoryService{

    constructor(
        @InjectRepository(Category)
        private readonly categoryRepository: Repository<Category>,
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>
    ){}


    async create(dto: CreateCategoryDto,tenantId:string){
        
        const category = await this.categoryRepository.create({
            ...dto,
            tenantId
        })

        try{
            return await this.categoryRepository.save(category)
        } catch(error:unknown){
            if (isPostgresUniqueViolation(error)) {
            throw new ConflictException(
                'La categoría ya está registrada',
            );
            }

            throw error;
        }     
    }

    async findAll(tenantId: string){
        return this.categoryRepository.find({
            where:{
                tenantId
            },
            order:{
                name: 'ASC'
            }
        })
    }

    async findOne(id:string, tenantId: string){
        const category = await this.categoryRepository.findOne({
            where:{
                id,
                tenantId
            }
        })

        if(!category) throw new NotFoundException('Categoría no encontrada')

        return category
    }

    async update(id:string, dto:UpdateCategoryDto, tenantId: string){
        const category = await this.categoryRepository.findOne({
            where:{
                id,
                tenantId
            }
        })
        if(!category) throw new NotFoundException('Categoría no encontrada')
        category.name = dto.name;
        return this.categoryRepository.save(category);
    }

    async remove(id:string, tenantId:string){
        const category = await this.categoryRepository.findOne({
            where:{
                id,
                tenantId
            }
        })
        if(!category) throw new NotFoundException('Categoria no encontrada')

        const productsCount = await this.productRepository.count({
            where:{
                tenantId,
                category: {id}
            }
        })

        if(productsCount > 0){
            throw new ConflictException('No se puede eliminar la categoría porque tiene productos asociados')
        }

        await this.categoryRepository.remove(category)
        return {
            message: 'Categoria eliminada Correctamente'
        }

    }


}



function isPostgresUniqueViolation(error: unknown,): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  const candidate = error as {
    code?: unknown;
    driverError?: {
      code?: unknown;
    };
  };

  return (
    candidate.code === '23505' ||
    candidate.driverError?.code === '23505'
  );
}