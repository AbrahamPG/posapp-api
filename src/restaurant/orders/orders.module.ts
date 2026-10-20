import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Order } from "./order.entity.js";
import { Table } from "../tables/table.entity.js";
import { OrderItem } from "./order-item.entity.js";
import { OrdersController } from "./orders.controller.js";
import { OrdersService } from "./orders.service.js";



@Module({
    imports:[
        TypeOrmModule.forFeature([
            Order,
            Table,
            OrderItem,
        ])
    ],
    controllers: [
        OrdersController
    ],
    providers:[
        OrdersService
    ]
})
export class OrdersModule {}