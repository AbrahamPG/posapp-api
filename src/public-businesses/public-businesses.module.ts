import { Module } from "@nestjs/common";
import { PublicBusinessesService } from "./public-businesses.service.js";
import { PublicBusinessesController } from "./public-businesses.controller.js";
import { BusinessProfile } from "../business-profile/business-profile.entity.js";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Product } from "../catalog/products/product.entity.js";
import { OrganizationModulesModule } from "../organization-module/organization-module.module.js";



@Module({
    imports: [
        TypeOrmModule.forFeature([BusinessProfile, Product]),
        OrganizationModulesModule,
    ],
    controllers: [
        PublicBusinessesController
    ],

    providers: [
        PublicBusinessesService
    ]
})
export class PublicBusinessesModule {}