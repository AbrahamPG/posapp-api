import { Type } from "class-transformer"
import { ArrayMinSize, IsArray, IsInt, IsOptional, IsString, IsUUID, Length, Min, ValidateNested } from "class-validator"




export class CreateOrderItemDto{

    @IsUUID()
    productId: string

    @Type(()=> Number)
    @IsInt()
    @Min(1)
    quantity: number
}


export class CreateOrderDto{

    @IsOptional()
    @IsUUID()
    tableId?: string

    @IsOptional()
    @IsString()
    @Length(1,100)
    idempotencyKey?: string

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({each: true})
    @Type(()=> CreateOrderItemDto)
    items: CreateOrderItemDto[]
}