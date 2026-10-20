import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { OrdersService } from "./orders.service.js";
import { CreateOrderDto } from "./dto/create-order.dto.js";
import { RequireActiveOrg, Session, type UserSession } from "@thallesp/nestjs-better-auth";
import { FindOrdersDto } from "./dto/find-orders.dto.js";
import { UpdateOrderStatusDto } from "./dto/update-order-status.dto.js";


@RequireActiveOrg()
@Controller('orders')
export class OrdersController{


    constructor(
        private readonly ordersService: OrdersService
    ){}


    @Post()
    create(
        @Body() dto: CreateOrderDto,
        @Session() session: UserSession
    ){
        return this.ordersService.createPosOrder(
            dto,
            session.session.activeOrganizationId!
        )
    }

    @Get()
    findAll(
        @Query() query: FindOrdersDto,
        @Session() session: UserSession
    ){
        return this.ordersService.findAll(
            session.session.activeOrganizationId!,
            query
        )
    }

    @Get(':id')
    findOne(
        @Param('id') id: string,
        @Session() session: UserSession 
    ){
        return this.ordersService.findOne(
            id,
            session.session.activeOrganizationId!
        )
    }

    @Patch(':id/status')
    update(
        @Param('id') id: string,
        @Session() session: UserSession,
        @Body() dto: UpdateOrderStatusDto
    ){
        return this.ordersService.updateStatus(
            id,
            session.session.activeOrganizationId!,
            dto.status
        )
    }

    @Patch(':id/cancel')
    cancel(
        @Param('id') id: string,
        @Session() session:UserSession
    ){
        return this.ordersService.cancelOrder(
            id,
            session.session.activeOrganizationId!
        )
    }












}