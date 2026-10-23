import { IsEnum } from 'class-validator';
import { KitchenOrderStatus } from '../kitchen-order.entity.js';

export class UpdateKitchenOrderStatusDto {
  @IsEnum(KitchenOrderStatus)
  status: KitchenOrderStatus;
}