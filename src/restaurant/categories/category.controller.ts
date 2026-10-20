import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { CategoryService } from "./category.service.js";
import { CreateCategoryDto } from "./dto/create-category.dto.js";
import { RequireActiveOrg, Session,  } from "@thallesp/nestjs-better-auth";
import type { UserSession } from "@thallesp/nestjs-better-auth"; 
import { UpdateCategoryDto } from "./dto/update-category.dto.js";

@RequireActiveOrg()
@Controller('categories')
export class CategoryController{

    constructor(
        private readonly categoryService: CategoryService
    ){}



    @Post()
    create(
        @Body() dto: CreateCategoryDto,
        @Session() session: UserSession
    ){
        return this.categoryService.create(
            dto,
            session.session.activeOrganizationId!,
        )
    }

    @Get()
    findAll(
        @Session() session: UserSession
    ){
        return this.categoryService.findAll(
            session.session.activeOrganizationId!
        )
    }

    @Get(':id')
    findOne(
        @Param('id') id: string,
        @Session() session: UserSession
    ){
        return this.categoryService.findOne(
            id,
            session.session.activeOrganizationId!
        )
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body() dto: UpdateCategoryDto,
        @Session() session: UserSession
    ){
        return this.categoryService.update(
            id,
            dto,
            session.session.activeOrganizationId!
        )
    }

    @Delete(':id')
    remove(
        @Param('id') id:string,
        @Session() session: UserSession
    ){
        return this.categoryService.remove(
            id,
            session.session.activeOrganizationId!
        )
    }

}