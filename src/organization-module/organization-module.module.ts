import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OrganizationModulesService } from "./organization-module.service.js";
import { OrganizationModule } from "./organization-module.entity.js";
import { OrganizationModulesAdminController } from "./organization-module.controller.js";




@Module({
    imports:[
        TypeOrmModule.forFeature([OrganizationModule])
    ],
    controllers:[OrganizationModulesAdminController],
    providers:[
        OrganizationModulesService
    ],
    exports:[
        OrganizationModulesService
    ]
})
export class OrganizationModulesModule {}