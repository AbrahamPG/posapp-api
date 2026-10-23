import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DataSource, EntityManager, In,  } from 'typeorm';

import { Order, OrderStatus } from './order.entity.js';
import { OrderItem } from './order-item.entity.js';
import { Product } from '../catalog/products/product.entity.js'; 
import { Table } from '../restaurant/tables/table.entity.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { FindOrdersDto } from './dto/find-orders.dto.js';
import { RestaurantOrder } from '../restaurant/restaurant-orders/restaurant-order.entity.js';

@Injectable()
export class OrdersService {
  constructor(
    private readonly dataSource: DataSource,
  ) {}

  
  async createOrder(
    dto: CreateOrderDto,
    tenantId: string,
    initialStatus: OrderStatus,
    associateTable: boolean,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const productRepo = manager.getRepository(Product);
      const tableRepo = manager.getRepository(Table);
      const restaurantOrderRepo = manager.getRepository(RestaurantOrder);

      // El catálogo público no puede asociar pedidos a mesas.
      if (!associateTable && dto.tableId) {
        throw new BadRequestException(
          'Los pedidos del catálogo no pueden asociarse a una mesa',
        );
      }

      const idempotencyKey = dto.idempotencyKey?.trim() || null;

      if (idempotencyKey) {
        const existingOrder = await orderRepo.findOne({
          where: { tenantId, idempotencyKey },
          relations: { items: true },
        });

        if (existingOrder) {
          return this.withRestaurantTable(manager, existingOrder);
        }
      }

      const productIds = [
        ...new Set(dto.items.map((item) => item.productId)),
      ];

      const [table, products] = await Promise.all([
        associateTable && dto.tableId
          ? tableRepo.findOne({
              where: { id: dto.tableId, tenantId },
            })
          : Promise.resolve(null),

        productRepo.find({
          where: { id: In(productIds), tenantId },
        }),
      ]);

      if (associateTable && dto.tableId && !table) {
        throw new NotFoundException('Mesa no encontrada');
      }

      const productsById = new Map(products.map((p) => [p.id, p]));
      const itemsToSave: Partial<OrderItem>[] = [];
      let totalCents = 0;

      for (const dtoItem of dto.items) {
        const product = productsById.get(dtoItem.productId);

        if (!product) {
          throw new NotFoundException(
            'Uno o más productos no existen o no pertenecen al negocio',
          );
        }

        if (product.agotado) {
          throw new BadRequestException(
            `El producto "${product.name}" está agotado`,
          );
        }

        const subtotalCents = product.priceCents * dtoItem.quantity;

        if (
          !Number.isSafeInteger(subtotalCents) ||
          !Number.isSafeInteger(totalCents + subtotalCents)
        ) {
          throw new BadRequestException('El total del pedido es demasiado grande');
        }

        totalCents += subtotalCents;

        itemsToSave.push({
          tenantId,
          product,
          productName: product.name,
          unitPriceCents: product.priceCents,
          quantity: dtoItem.quantity,
          subtotalCents,
        });
      }

      // La orden comercial ya no conoce la mesa.
      const order = orderRepo.create({
        tenantId,
        status: initialStatus,
        totalCents,
        idempotencyKey,
        items: itemsToSave as OrderItem[],
      });

      const savedOrder = await orderRepo.save(order);

      // Solo el flujo POS de restaurante crea esta asociación.
      if (associateTable && table) {
        const restaurantOrder = restaurantOrderRepo.create({
          tenantId,
          orderId: savedOrder.id,
          order: savedOrder,
          tableId: table.id,
          table,
        });

        await restaurantOrderRepo.save(restaurantOrder);
      }

      return this.withRestaurantTable(manager, savedOrder);
    });
  }

  private async withRestaurantTable(
    manager: EntityManager,
    order: Order,
  ) {
    const restaurantOrder = await manager
      .getRepository(RestaurantOrder)
      .findOne({
        where: {
          tenantId: order.tenantId,
          orderId: order.id,
        },
        relations: { table: true },
      });

    // Conservamos temporalmente la propiedad "table" en la respuesta
    // para no romper las pantallas que ya consumen ese formato.
    return {
      ...order,
      table: restaurantOrder?.table ?? null,
    };
  }


  async createPosOrder(dto: CreateOrderDto, tenantId: string){
    return this.createOrder(dto, tenantId , OrderStatus.OPEN, true)
  }
  async createCatalogOrder(dto:CreateOrderDto, tenantId: string){
    return this.createOrder(dto, tenantId, OrderStatus.PENDING_CONFIRMATION, false)
  }



  
  async findOne(id: string, tenantId: string) {
  const order = await this.dataSource
    .getRepository(Order)
    .findOne({
      where: { id, tenantId },
      relations: {
        items: {
          product: true,
        },
      },
    });

  if (!order) {
    throw new NotFoundException('Orden no encontrada');
  }

  return this.withRestaurantTable(this.dataSource.manager, order);
}

  async findAll(tenantId: string, query: FindOrdersDto){
    const page = query.page ?? 1
    const limit = Math.min(query.limit ?? 10,100)

    const where = {
        tenantId,
        ...(query.status ? {status: query.status}:{})
    }

    const [orders, total] = await this.dataSource
  .getRepository(Order)
  .findAndCount({
    where,
    order: { createdAt: 'DESC' },
    skip: (page - 1) * limit,
    take: limit,
  });

const orderIds = orders.map((order) => order.id);

const restaurantOrders = orderIds.length
  ? await this.dataSource.getRepository(RestaurantOrder).find({
      where: {
        tenantId,
        orderId: In(orderIds),
      },
      relations: { table: true },
    })
  : [];

const restaurantOrdersByOrderId = new Map(
  restaurantOrders.map((restaurantOrder) => [
    restaurantOrder.orderId,
    restaurantOrder,
  ]),
);

return {
  data: orders.map((order) => ({
    ...order,
    table: restaurantOrdersByOrderId.get(order.id)?.table ?? null,
  })),
  meta: {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  },
};
  }

  async updateStatus(id:string, tenantId:string, status:OrderStatus){

    return this.dataSource.transaction(async manager=>{
        const orderRepo = manager.getRepository(Order)

        const order = await orderRepo.findOne({
            where: { id, tenantId}
        })

        if(!order) throw new NotFoundException('Orden no encontrada')

        if(order.status === OrderStatus.PAID ||
            order.status === OrderStatus.CANCELLED
        ){
            throw new BadRequestException('No puedes modificar el estado de una orden finalizada')
        }
        
        const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
            [OrderStatus.PENDING_CONFIRMATION]: [
                OrderStatus.OPEN,
                OrderStatus.CANCELLED
            ],
            
            [OrderStatus.OPEN]: [
                OrderStatus.PAYMENT_PENDING,
                OrderStatus.CANCELLED,
            ],
            [OrderStatus.PAYMENT_PENDING]: [
                OrderStatus.OPEN,
                OrderStatus.PAID,
                OrderStatus.CANCELLED,
            ],
            [OrderStatus.PAID]: [],
            [OrderStatus.CANCELLED]: [],
        }

        if(!allowedTransitions[order.status].includes(status)) throw new BadRequestException('Transicion de estado no permitido')

        order.status = status

    return orderRepo.save(order)
    })
  }

  async cancelOrder(id:string, tenantId: string){
    return this.updateStatus(id,tenantId, OrderStatus.CANCELLED)
  }

  async addItems(
    orderId: string,
    tenantId: string,
    dto: Pick<CreateOrderDto, 'items'>,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const productRepo = manager.getRepository(Product);
      const itemRepo = manager.getRepository(OrderItem);

      // 1. Buscar y bloquear la cuenta existente.
      const order = await orderRepo.findOne({
        where: { id: orderId, tenantId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!order) {
        throw new NotFoundException('Orden no encontrada');
      }

      // 2. Solo permitimos agregar productos a cuentas abiertas.
      if (order.status !== OrderStatus.OPEN) {
        throw new BadRequestException(
          'Solo puedes agregar productos a una orden abierta',
        );
      }

      if (!dto.items?.length) {
        throw new BadRequestException(
          'Debes agregar al menos un producto',
        );
      }

      // 3. Obtener los productos del mismo negocio.
      const productIds = [
        ...new Set(dto.items.map((item) => item.productId)),
      ];

      const products = await productRepo.find({
        where: {
          id: In(productIds),
          tenantId,
        },
      });

      const productsById = new Map(
        products.map((product) => [product.id, product]),
      );

      const newItems: OrderItem[] = [];
      let additionalTotalCents = 0;

      // 4. Crear únicamente las nuevas líneas.
      for (const dtoItem of dto.items) {
        if (
          !Number.isSafeInteger(dtoItem.quantity) ||
          dtoItem.quantity <= 0
        ) {
          throw new BadRequestException(
            'La cantidad debe ser un entero positivo',
          );
        }

        const product = productsById.get(dtoItem.productId);

        if (!product) {
          throw new NotFoundException(
            'Uno o más productos no existen o no pertenecen al negocio',
          );
        }

        if (product.agotado) {
          throw new BadRequestException(
            `El producto "${product.name}" está agotado`,
          );
        }

        const subtotalCents =
          product.priceCents * dtoItem.quantity;

        if (
          !Number.isSafeInteger(subtotalCents) ||
          !Number.isSafeInteger(
            additionalTotalCents + subtotalCents,
          ) ||
          !Number.isSafeInteger(
            order.totalCents +
              additionalTotalCents +
              subtotalCents,
          )
        ) {
          throw new BadRequestException(
            'El total de la orden es demasiado grande',
          );
        }

        additionalTotalCents += subtotalCents;

        newItems.push(
          itemRepo.create({
            tenantId,
            order,
            product,
            productName: product.name,
            unitPriceCents: product.priceCents,
            quantity: dtoItem.quantity,
            subtotalCents,
          }),
        );
      }

      // 5. Guardar las líneas nuevas sin reemplazar las anteriores.
      await itemRepo.save(newItems);

      // 6. Acumular el importe en la misma cuenta.
      order.totalCents += additionalTotalCents;
      await orderRepo.save(order);

      // 7. Devolver la cuenta actualizada con todos sus productos.
      const updatedOrder = await orderRepo.findOne({
        where: { id: order.id, tenantId },
        relations: {
          items: {
            product: true,
          },
        },
      });

      if (!updatedOrder) {
        throw new NotFoundException('Orden no encontrada');
      }

      return this.withRestaurantTable(manager, updatedOrder);
    });
  }


}
