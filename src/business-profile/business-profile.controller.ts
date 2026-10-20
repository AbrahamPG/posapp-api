
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
} from '@nestjs/common';
import {
  RequireActiveOrg,
  Session,
  type UserSession,
} from '@thallesp/nestjs-better-auth';

import { BusinessProfileService } from './business-profile.service.js';
import { CreateBusinessProfileDto } from './dto/create-business-profile.dto.js';
import { UpdateBusinessProfileDto } from './dto/update-business-profile.dto.js';

@RequireActiveOrg()
@Controller('business-profile')
export class BusinessProfileController {
  constructor(
    private readonly businessProfileService: BusinessProfileService,
  ) {}

  @Post()
  create(
    @Body() dto: CreateBusinessProfileDto,
    @Session() session: UserSession,
  ) {
    return this.businessProfileService.create(
      this.getTenantId(session),
      dto,
    );
  }

  @Get('me')
  findMine(@Session() session: UserSession) {
    return this.businessProfileService.findMine(
      this.getTenantId(session),
    );
  }

  @Patch('me')
  update(
    @Body() dto: UpdateBusinessProfileDto,
    @Session() session: UserSession,
  ) {
    return this.businessProfileService.update(
      this.getTenantId(session),
      dto,
    );
  }

  private getTenantId(session: UserSession): string {
    const tenantId = session.session.activeOrganizationId;

    if (!tenantId) {
      throw new BadRequestException(
        'Debes seleccionar una organización activa',
      );
    }

    return tenantId;
  }
}
