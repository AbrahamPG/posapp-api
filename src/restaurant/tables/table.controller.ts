import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from "@nestjs/common";
import { TablesService } from "./table.service.js";
import { CreateTableDto } from "./dto/create-table.dto.js";
import { RequireActiveOrg, Session } from "@thallesp/nestjs-better-auth";
import type { UserSession } from "@thallesp/nestjs-better-auth";
import { UpdateTableDto } from "./dto/update-table.dto.js";
import { UpdateTableStatusDto } from "./dto/update-table-status.dto.js";

@RequireActiveOrg()
@Controller('tables')
export class TableController{


    constructor(
        private readonly tablesService: TablesService
    ){}

    @Post()
    create(
        @Body() dto: CreateTableDto,
        @Session() session: UserSession
    ){
        return this.tablesService.create(
            session.session.activeOrganizationId!,
            dto,
        )
    }

    @Get()
    findAll(
        @Session() session: UserSession
    ){
        return this.tablesService.findAll(
            session.session.activeOrganizationId!
        )
    }

    @Get(':id')
    findOne(
        @Param('id', ParseUUIDPipe) id: string,
        @Session() session: UserSession 
    ){
        return this.tablesService.findOne(
            session.session.activeOrganizationId!,
            id
        )
    }

    @Patch(':id')
    update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateTableDto,
        @Session() session: UserSession
    ){
        return this.tablesService.update(
            id,
            dto,
            session.session.activeOrganizationId!
        )
    }

    @Delete(':id')
    remove(
        @Param('id', ParseUUIDPipe) id: string,
        @Session() session: UserSession
    ){
        return this.tablesService.remove(
            id,
            session.session.activeOrganizationId!
        )
    }

    @Patch(':id/status')
    updateStatus(
        @Param('id',ParseUUIDPipe) id: string,
        @Body() dto:UpdateTableStatusDto,
        @Session() session: UserSession
    ){
        return this.tablesService.updateStatus(
            id,
            dto.status,
            session.session.activeOrganizationId!
        )
    }

}