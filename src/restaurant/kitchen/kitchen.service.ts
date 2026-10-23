
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DataSource, In } from 'typeorm';

import { Order, OrderStatus } from '../../orders/order.entity.js';
import { OrderItem } from '../../orders/order-item.entity.js';
import { RestaurantOrder } from '../restaurant-orders/restaurant-order.entity.js';

import {
  KitchenOrder,
  KitchenOrderStatus,
} from './kitchen-order.entity.js';

import { KitchenOrderItem } from './kitchen-order-item.entity.js';

@Injectable()
export class KitchenService {
  constructor(private readonly dataSource: DataSource) {}

  async sendToKitchen(orderId: string, tenantId: string) {
    return this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const orderItemRepo = manager.getRepository(OrderItem);
      const restaurantOrderRepo = manager.getRepository(RestaurantOrder);
      const kitchenRepo = manager.getRepository(KitchenOrder);
      const kitchenItemRepo = manager.getRepository(KitchenOrderItem);

      // 1. Bloqueamos la cuenta para evitar envíos concurrentes.
      const order = await orderRepo.findOne({
        where: { id: orderId, tenantId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!order) {
        throw new NotFoundException('Orden no encontrada');
      }

      // 2. Solo admitimos órdenes del flujo de mesas.
      const restaurantOrder = await restaurantOrderRepo.findOne({
        where: { tenantId, orderId },
      });

      if (!restaurantOrder) {
        throw new BadRequestException(
          'La orden no pertenece al flujo de mesas del restaurante',
        );
      }

      if (order.status !== OrderStatus.OPEN) {
        throw new BadRequestException(
          'Solo se pueden enviar a cocina órdenes abiertas',
        );
      }

      // 3. Obtenemos todas las líneas de la cuenta.
      const orderItems = await orderItemRepo.find({
        where: {
          tenantId,
          order: { id: orderId },
        },
        order: {
          createdAt: 'ASC',
          id: 'ASC',
        },
      });

      if (orderItems.length === 0) {
        throw new BadRequestException(
          'La orden no tiene productos para enviar a cocina',
        );
      }

      // 4. Averiguamos qué líneas ya fueron enviadas anteriormente.
      const sentItems = await kitchenItemRepo.find({
        where: {
          tenantId,
          orderItemId: In(orderItems.map((item) => item.id)),
        },
        select: {
          orderItemId: true,
        },
      });

      const sentItemIds = new Set(
        sentItems.map((item) => item.orderItemId),
      );

      const newItems = orderItems.filter(
        (item) => !sentItemIds.has(item.id),
      );

      // 5. Si no hay líneas nuevas, no creamos otro ticket.
      if (newItems.length === 0) {
        const latestTicket = await kitchenRepo.findOne({
          where: { tenantId, orderId },
          order: { dispatchNumber: 'DESC' },
          relations: {
            order: true,
            items: { orderItem: true },
          },
        });

        if (!latestTicket) {
          throw new BadRequestException(
            'No hay productos nuevos para enviar a cocina',
          );
        }

        if (latestTicket.status === KitchenOrderStatus.CANCELLED) {
          throw new BadRequestException(
            'El último ticket fue cancelado y no hay productos nuevos para enviar',
          );
        }

        // Repetir la petición no genera un ticket duplicado.
        return this.formatKitchenTicket(latestTicket);
      }

      // 6. Numeramos el nuevo envío dentro de esta cuenta.
      const latestTicket = await kitchenRepo.findOne({
        where: { tenantId, orderId },
        order: { dispatchNumber: 'DESC' },
        select: {
          id: true,
          dispatchNumber: true,
        },
      });

      const dispatchNumber =
        (latestTicket?.dispatchNumber ?? 0) + 1;

      // 7. Creamos un ticket nuevo para esta tanda.
      const kitchenOrder = kitchenRepo.create({
        tenantId,
        orderId,
        order,
        dispatchNumber,
        status: KitchenOrderStatus.PENDING,
      });

      const savedTicket = await kitchenRepo.save(kitchenOrder);

      // 8. Asociamos SOLO las líneas nuevas al ticket.
      const dispatchItems = newItems.map((orderItem) =>
        kitchenItemRepo.create({
          tenantId,
          kitchenOrderId: savedTicket.id,
          kitchenOrder: savedTicket,
          orderItemId: orderItem.id,
          orderItem,
        }),
      );

      await kitchenItemRepo.save(dispatchItems);

      // 9. Devolvemos el ticket con sus propias líneas.
      const result = await kitchenRepo.findOne({
        where: {
          id: savedTicket.id,
          tenantId,
        },
        relations: {
          order: true,
          items: { orderItem: true },
        },
      });

      if (!result) {
        throw new NotFoundException(
          'No se pudo recuperar el ticket de cocina',
        );
      }

      return this.formatKitchenTicket(result);
    });
  }

  async findQueue(tenantId: string) {
    // La cola carga las líneas de cada ticket, no todas las líneas
    // acumuladas en la cuenta.
    const kitchenOrders = await this.dataSource
      .getRepository(KitchenOrder)
      .createQueryBuilder('kitchen')
      .innerJoinAndSelect(
        'kitchen.order',
        'order',
        'order.tenantId = kitchen.tenantId',
      )
      .leftJoinAndSelect('kitchen.items', 'dispatchItem')
      .leftJoinAndSelect(
        'dispatchItem.orderItem',
        'orderItem',
      )
      .where('kitchen.tenantId = :tenantId', { tenantId })
      .andWhere('kitchen.status IN (:...statuses)', {
        statuses: [
          KitchenOrderStatus.PENDING,
          KitchenOrderStatus.PREPARING,
          KitchenOrderStatus.READY,
        ],
      })
      .orderBy('kitchen.sentAt', 'ASC')
      .addOrderBy('kitchen.dispatchNumber', 'ASC')
      .getMany();

    const orderIds = [
      ...new Set(kitchenOrders.map((item) => item.orderId)),
    ];

    const restaurantOrders = orderIds.length
      ? await this.dataSource.getRepository(RestaurantOrder).find({
          where: orderIds.map((orderId) => ({
            tenantId,
            orderId,
          })),
          relations: { table: true },
        })
      : [];

    const tableByOrderId = new Map(
      restaurantOrders.map((item) => [
        item.orderId,
        item.table,
      ]),
    );

    return kitchenOrders.map((item) => ({
      ...this.formatKitchenTicket(item),
      table: tableByOrderId.get(item.orderId) ?? null,
    }));
  }

  async updateStatus(
    id: string,
    tenantId: string,
    status: KitchenOrderStatus,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(KitchenOrder);

      const kitchenOrder = await repo.findOne({
        where: { id, tenantId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!kitchenOrder) {
        throw new NotFoundException(
          'Preparación de cocina no encontrada',
        );
      }

      const transitions: Record<
        KitchenOrderStatus,
        KitchenOrderStatus[]
      > = {
        [KitchenOrderStatus.PENDING]: [
          KitchenOrderStatus.PREPARING,
          KitchenOrderStatus.CANCELLED,
        ],
        [KitchenOrderStatus.PREPARING]: [
          KitchenOrderStatus.READY,
          KitchenOrderStatus.CANCELLED,
        ],
        [KitchenOrderStatus.READY]: [
          KitchenOrderStatus.SERVED,
          KitchenOrderStatus.CANCELLED,
        ],
        [KitchenOrderStatus.SERVED]: [],
        [KitchenOrderStatus.CANCELLED]: [],
      };

      if (!transitions[kitchenOrder.status].includes(status)) {
        throw new BadRequestException(
          `No se permite pasar de ${kitchenOrder.status} a ${status}`,
        );
      }

      kitchenOrder.status = status;

      if (status === KitchenOrderStatus.READY) {
        kitchenOrder.readyAt = new Date();
      }

      if (status === KitchenOrderStatus.SERVED) {
        kitchenOrder.servedAt = new Date();
      }

      const saved = await repo.save(kitchenOrder);

      return repo.findOne({
        where: { id: saved.id, tenantId },
        relations: {
          order: true,
          items: { orderItem: true },
        },
      });
    });
  }

  private formatKitchenTicket(ticket: KitchenOrder) {
    return {
      ...ticket,
      items: (ticket.items ?? []).map((dispatchItem) => ({
        ...dispatchItem.orderItem,
        kitchenOrderItemId: dispatchItem.id,
      })),
    };
  }
}
