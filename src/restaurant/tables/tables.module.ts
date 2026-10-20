import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Table } from './table.entity.js';
import { TableController } from './table.controller.js';
import { TablesService } from './table.service.js';

@Module({
    imports:[
        TypeOrmModule.forFeature([Table])
    ],
    controllers: [
        TableController
    ],
    providers:[
        TablesService
    ]
})
export class TablesModule {}
