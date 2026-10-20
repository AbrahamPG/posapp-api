import { IsBoolean, IsInt, IsNotEmpty, IsString, IsUUID, MaxLength, Min } from "class-validator"




export class CreateProductDto{


    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    name: string

    @IsInt()
    @Min(1)
    priceCents: number

    @IsBoolean()
    agotado: boolean = false

    @IsBoolean()
    trackStock: boolean = false

    @IsUUID()
    categoryId: string 

}