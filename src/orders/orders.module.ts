import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Order } from "./order.entity.js";
import { Table } from "../restaurant/tables/table.entity.js";
import { OrderItem } from "./order-item.entity.js";
import { OrdersController } from "./orders.controller.js";
import { OrdersService } from "./orders.service.js";
import { RestaurantOrder } from "../restaurant/restaurant-orders/restaurant-order.entity.js";
import { Product } from "../catalog/products/product.entity.js";



@Module({
    imports:[
        TypeOrmModule.forFeature([
            Order,
            Table,
            OrderItem,
            RestaurantOrder,
            Product,
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