import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { KitchenOrder } from './kitchen-order.entity.js';
import { KitchenController } from './kitchen.controller.js';
import { KitchenService } from './kitchen.service.js';

import { Order } from '../../orders/order.entity.js';
import { OrderItem } from '../../orders/order-item.entity.js';
import { RestaurantOrder } from '../restaurant-orders/restaurant-order.entity.js';
import { KitchenOrderItem } from './kitchen-order-item.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      KitchenOrder,
      KitchenOrderItem,
      Order,
      OrderItem,
      RestaurantOrder,
    ]),
  ],
  controllers: [KitchenController],
  providers: [KitchenService],
  exports: [KitchenService],
})
export class KitchenModule {}