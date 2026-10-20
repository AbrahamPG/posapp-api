import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { DataSource, In,  } from 'typeorm';

import { Order, OrderStatus } from './order.entity.js';
import { OrderItem } from './order-item.entity.js';
import { Product } from '../products/product.entity.js';
import { Table } from '../tables/table.entity.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { FindOrdersDto } from './dto/find-orders.dto.js';

@Injectable()
export class OrdersService {
  constructor(
    private readonly dataSource: DataSource,
  ) {}

  async createOrder(dto: CreateOrderDto, tenantId: string, initialStatus: OrderStatus) {
    return this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const productRepo = manager.getRepository(Product);
      const tableRepo = manager.getRepository(Table);

      // 1. Idempotencia: Evitar duplicados por reintentos de red
      const idempotencyKey = dto.idempotencyKey?.trim() || null;
      if (idempotencyKey) {
        const existingOrder = await orderRepo.findOne({
          where: { tenantId, idempotencyKey },
          relations: { items: true }, // Trae los ítems por si la app cliente los necesita pintar de inmediato
        });
        if (existingOrder) return existingOrder;
      }

      // 2. Extraer IDs únicos de productos
      const productIds = [...new Set(dto.items.map((item) => item.productId))];

      // 3. Optimización de rendimiento: Consultas asíncronas en paralelo
      const [table, products] = await Promise.all([
        dto.tableId ? tableRepo.findOne({ where: { id: dto.tableId, tenantId } }) : Promise.resolve(null),
        productRepo.find({ where: { id: In(productIds), tenantId } }),
      ]);

      // Validar mesa si fue enviada en el DTO
      if (dto.tableId && !table) {
        throw new NotFoundException('Mesa no encontrada');
      }

      // Mapeo O(1) de productos
      const productsById = new Map(products.map((p) => [p.id, p]));

      // 4. Validar negocio y estructurar los ítems en memoria (sin guardar en BD aún)
      const itemsToSave: Partial<OrderItem>[] = [];
      let totalCents = 0;

      for (const dtoItem of dto.items) {
        const product = productsById.get(dtoItem.productId);

        if (!product) {
          throw new NotFoundException('Uno o más productos no existen o no pertenecen al tenant');
        }

        if (product.agotado) {
          throw new BadRequestException(`El producto "${product.name}" está agotado`);
        }

        const subtotalCents = product.priceCents * dtoItem.quantity;
        totalCents += subtotalCents;

        // Estructuramos el objeto plano sin usar el repositorio de ítems
        itemsToSave.push({
          tenantId,
          product,
          productName: product.name,
          unitPriceCents: product.priceCents,
          quantity: dtoItem.quantity,
          subtotalCents,
        });
      }

      // 5. Crear la orden inyectándole directamente sus ítems
      const order = orderRepo.create({
        tenantId,
        status: initialStatus,
        totalCents,
        idempotencyKey,
        table,
        items: itemsToSave as OrderItem[], // 👈 Asignamos los ítems directamente aquí
      });

      // 6. Un único SAVE para guardarlo todo gracias al CASCADE
      // TypeORM guardará la orden, obtendrá su ID, asignará el id de la orden a los ítems e insertará los ítems. Todo en un abrir y cerrar de ojos.
      return await orderRepo.save(order);
    });
  }

  async createPosOrder(dto: CreateOrderDto, tenantId: string){
    return this.createOrder(dto, tenantId , OrderStatus.OPEN)
  }
  async createCatalogOrder(dto:CreateOrderDto, tenantId: string){
    return this.createOrder(dto, tenantId, OrderStatus.PENDING_CONFIRMATION)
  }



  
  async findOne(id:string ,tenantId: string){
    const order = await this.dataSource
        .getRepository(Order)
        .findOne({
            where: {
                id,
                tenantId
            },
            relations: {
              items: {
                product: true
              },
              table: true
            }
        })
    
    if(!order){
        throw new NotFoundException('Order no encontrada')
    }

    return order
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
            relations: {
                table: true
            },
            order: {
                createdAt: 'DESC'
            },
            skip: (page-1) * limit,
            take: limit
        })

    return {
        data: orders,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total/limit)
        }
    }
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








}
