import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import {
  RequireActiveOrg,
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth';

import { KitchenService } from './kitchen.service.js';
import { UpdateKitchenOrderStatusDto } from './dto/update-kitchen-order-status.dto.js';

@RequireActiveOrg()
@Controller('restaurant/kitchen/orders')
export class KitchenController {
  constructor(
    private readonly kitchenService: KitchenService,
  ) {}

  @Post(':orderId')
  sendToKitchen(
    @Param('orderId') orderId: string,
    @Session() session: UserSession,
  ) {
    return this.kitchenService.sendToKitchen(
      orderId,
      session.session.activeOrganizationId!,
    );
  }

  @Get()
  findQueue(
    @Session() session: UserSession,
  ) {
    return this.kitchenService.findQueue(
      session.session.activeOrganizationId!,
    );
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateKitchenOrderStatusDto,
    @Session() session: UserSession,
  ) {
    return this.kitchenService.updateStatus(
      id,
      session.session.activeOrganizationId!,
      dto.status,
    );
  }
}