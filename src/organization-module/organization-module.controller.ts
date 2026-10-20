
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';

import { OrganizationModulesService, ModuleKey } from './organization-module.service.js';
import { SuperAdminGuard } from '../core/auth/guards/super-admin.guard.js';
import type { AppUserSession } from '../core/auth/auth.js';

@Controller('admin/organizations')
@UseGuards(SuperAdminGuard)
export class OrganizationModulesAdminController {
  constructor(
    private readonly organizationModulesService: OrganizationModulesService,
  ) {}

  @Get(':organizationId/modules')
  getModules(
    @Param('organizationId') organizationId: string,
  ) {
    return this.organizationModulesService.getModulesByOrganization(
      organizationId,
    );
  }

  @Post(':organizationId/modules/:moduleKey/activate')
  activateModule(
    @Param('organizationId') organizationId: string,
    @Param('moduleKey') moduleKey: string,
    @Body() body: { durationDays?: number },
    @Session() session: AppUserSession,
  ) {
    const key = this.validateModuleKey(moduleKey);

    if (
      !Number.isInteger(body?.durationDays) ||
      body.durationDays! < 1
    ) {
      throw new BadRequestException(
        'durationDays debe ser un entero mayor que cero',
      );
    }

    return this.organizationModulesService.activateModule(
      organizationId,
      key,
      body.durationDays!,
      session.user.id,
    );
  }

  @Post(':organizationId/modules/:moduleKey/deactivate')
  deactivateModule(
    @Param('organizationId') organizationId: string,
    @Param('moduleKey') moduleKey: string,
  ) {
    return this.organizationModulesService.deactivateModule(
      organizationId,
      this.validateModuleKey(moduleKey),
    );
  }

  private validateModuleKey(moduleKey: string): ModuleKey {
    if (moduleKey !== 'catalog' && moduleKey !== 'pos') {
      throw new BadRequestException(
        'Módulo inválido. Valores permitidos: catalog, pos',
      );
    }

    return moduleKey;
  }
}
