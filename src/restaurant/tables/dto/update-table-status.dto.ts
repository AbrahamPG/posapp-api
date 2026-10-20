import { IsEnum } from "class-validator";
import { TableStatus } from "../table.entity.js";



export class UpdateTableStatusDto{
    @IsEnum(TableStatus)
    status: TableStatus
}