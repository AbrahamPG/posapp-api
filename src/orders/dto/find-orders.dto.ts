import { IsEnum, IsInt, IsOptional, Min } from "class-validator";
import { OrderStatus } from "../order.entity.js";
import { Type } from "class-transformer";





export class FindOrdersDto{

    @IsOptional()
    @IsEnum(OrderStatus)
    status?: OrderStatus

    @IsOptional()
    @Type(()=>Number)
    @IsInt()
    @Min(1)
    page?: number = 1

    @IsOptional()
    @Type(()=>Number)
    @IsInt()
    @Min(1)
    limit?: number = 10
}