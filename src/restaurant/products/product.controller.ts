import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ProductService } from "./product.service.js";
import { CreateProductDto } from "./dto/create-product.dto.js";
import { Session } from "@thallesp/nestjs-better-auth";
import type { UserSession } from "@thallesp/nestjs-better-auth";
import { UpdateProductDto } from "./dto/update-product.dto.js";


@Controller('products')
export class ProductController{

    constructor(
        private readonly productService: ProductService
    ){}


    @Post()
    create(
        @Body() dto: CreateProductDto,
        @Session() session: UserSession
    ){
        return this.productService.create(
            dto,
            session.session.activeOrganizationId!
        )
    }

    @Get()
    findAll(
        @Session() session:UserSession
    ){
        return this.productService.findAll(session.session.activeOrganizationId!)
    }

    @Get(':id')
    findOne(
        @Param('id') id: string,
        @Session() session:UserSession
    ){
        return this.productService.findOne(id,session.session.activeOrganizationId!)
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() dto: UpdateProductDto,
        @Session() session: UserSession
    ){
        return this.productService.update(
            id,
            dto,
            session.session.activeOrganizationId!
        )
    }

    @Delete(':id')
    remove(
        @Param('id') id: string,
        @Session() session: UserSession
    ){
        return this.productService.remove(
            id,
            session.session.activeOrganizationId!
        )
    }

}