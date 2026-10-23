import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './core/auth/auth.js';
import { CategoryModule } from './catalog/categories/category.module.js'; 
import { ProductModule } from './catalog/products/product.module.js'; 
import { TablesModule } from './restaurant/tables/tables.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { BusinessProfileModule } from './business-profile/business-profile.module.js';
import { OrganizationModulesModule } from './organization-module/organization-module.module.js';
import { PublicBusinessesModule } from './public-businesses/public-businesses.module.js';
import { KitchenModule } from './restaurant/kitchen/kitchen.module.js';


@Module({
  imports: [
    KitchenModule,
    PublicBusinessesModule,
    OrdersModule,
    TablesModule,
    ProductModule,
    CategoryModule,
    BusinessProfileModule,
    OrganizationModulesModule,
    ConfigModule.forRoot({
      isGlobal: true
    }),
    
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: false,
    }),

    AuthModule.forRoot({
      auth
    }),

  ],
  controllers: [AppController],
  providers: [AppService],

})
export class AppModule {}
