import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Repository } from "typeorm";
import { Table, TableStatus } from "./table.entity.js";
import { InjectRepository } from "@nestjs/typeorm";
import { CreateTableDto } from "./dto/create-table.dto.js";
import { UpdateTableDto } from "./dto/update-table.dto.js";


@Injectable()
export class TablesService{


    constructor(
        @InjectRepository(Table)
        private readonly tableRepository: Repository<Table>
    ){}



    async create(tenantId: string ,dto:CreateTableDto){
        const table = this.tableRepository.create({
                ...dto,
                tenantId,
        })

        try{
            return await this.tableRepository.save(table)
        }catch(error){
            if(this.isUniqueViolation(error)){
                throw new ConflictException('Ya existe una mesa con ese nombre en este negocio!!')
            }
            throw error
        }
    }

    async findAll(tenantId: string){
        return this.tableRepository.find({
            where: {
                tenantId
            },
            order: {
                name: 'ASC'
            }
        })
    }

    async findOne(tenantId: string, id: string){
        const table = await this.tableRepository.findOne({
            where: {
                tenantId,
                id
            }
        })

        if(!table) throw new NotFoundException('Mesa no encontrada')
        
        return table        
    }

    async update( id: string, dto: UpdateTableDto, tenantId: string){
        const table = await this.findOne(tenantId, id)
        Object.assign(table, dto)

        try{
            return await this.tableRepository.save(table)
        }catch(error){
            if(this.isUniqueViolation(error)){
                throw new ConflictException('Ya existe una mesa con ese nombre en este negocio')
            }
            throw error
        }
    }

    async remove(id: string, tenantId: string){
        const table = await this.findOne(tenantId, id)
        await this.tableRepository.remove(table)

        return {
            message: `${table.name} eliminado correctamente`
        }

    }

    async updateStatus(id:string, status: TableStatus, tenantId: string){
        const table = await this.findOne(tenantId, id)

        table.status = status
        return this.tableRepository.save(table)
    }


    /////////////// FUNCION PARA LLAMAR A UN ERROR CON DUPLICADOS
    private isUniqueViolation(error: unknown):boolean{
        return(
            typeof error === 'object' && error !== null && 'code' in error && error.code === '23505'
        )
    }






}