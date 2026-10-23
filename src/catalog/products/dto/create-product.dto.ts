import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, IsUUID, MaxLength, Min } from "class-validator"




export class CreateProductDto{


    @IsString()
    @IsNotEmpty()
    @MaxLength(150)
    name: string

    @IsOptional()
    @IsString()
    @MaxLength(500)
    description?: string

    @IsInt()
    @Min(1)
    priceCents: number

    @IsOptional()
    @IsUrl({protocols: ['http', 'https'], require_protocol: true})
    @MaxLength(500)
    imageUrl?: string

    @IsBoolean()
    agotado: boolean = false

    @IsBoolean()
    trackStock: boolean = false

    @IsOptional()
    @IsBoolean()
    isVisibleInCatalog: boolean = true

    @IsUUID()
    categoryId: string 

}