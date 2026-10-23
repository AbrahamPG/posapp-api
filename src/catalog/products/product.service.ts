
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Product } from "./product.entity.js";
import { Category } from "../categories/category.entity.js";
import { CreateProductDto } from "./dto/create-product.dto.js";
import { UpdateProductDto } from "./dto/update-product.dto.js";

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(dto: CreateProductDto, tenantId: string) {
    const category = await this.categoryRepository.findOne({
      where: {
        id: dto.categoryId,
        tenantId,
      },
    });

    if (!category) {
      throw new NotFoundException("Categoría no encontrada");
    }

    const {
      categoryId,
      agotado,
      trackStock,
      isVisibleInCatalog,
      ...productData
    } = dto;

    const product = this.productRepository.create({
      ...productData,
      tenantId,
      category,
      agotado: agotado ?? false,
      trackStock: trackStock ?? false,
      isVisibleInCatalog: isVisibleInCatalog ?? true,
    });

    return this.productRepository.save(product);
  }

  async findAll(tenantId: string) {
    return this.productRepository.find({
      where: { tenantId },
      relations: { category: true },
      order: { name: "ASC" },
    });
  }

  async findOne(id: string, tenantId: string) {
    const product = await this.productRepository.findOne({
      where: { id, tenantId },
      relations: { category: true },
    });

    if (!product) {
      throw new NotFoundException("Producto no encontrado");
    }

    return product;
  }

  async update(
    id: string,
    dto: UpdateProductDto,
    tenantId: string,
  ) {
    const product = await this.findOne(id, tenantId);

    const { categoryId, ...productData } = dto;

    if (categoryId) {
      const category = await this.categoryRepository.findOne({
        where: {
          id: categoryId,
          tenantId,
        },
      });

      if (!category) {
        throw new NotFoundException("Categoría no encontrada");
      }

      product.category = category;
    }

    Object.assign(product, productData);

    return this.productRepository.save(product);
  }

  async remove(id: string, tenantId: string) {
    const product = await this.findOne(id, tenantId);

    await this.productRepository.remove(product);

    return {
      message: "Producto eliminado correctamente",
    };
  }
}
