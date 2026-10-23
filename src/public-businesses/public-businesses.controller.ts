
import { Controller, Get, Param } from '@nestjs/common';
import { PublicBusinessesService } from './public-businesses.service.js';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

@AllowAnonymous()
@Controller('public/businesses')
export class PublicBusinessesController {
  constructor(
    private readonly publicBusinessesService: PublicBusinessesService,
  ) {}

  @Get()
  findPublished() {
    return this.publicBusinessesService.findPublished();
  }

  @Get(':businessId')
  findPublishedById(
    @Param('businessId') businessId: string,
  ) {
    return this.publicBusinessesService.findPublishedById(businessId);
  }

  @Get(':businessId/catalog')
  findPublicCatalog(
    @Param('businessId') businessId: string,
  ) {
    return this.publicBusinessesService.findPublicCatalog(businessId);
  }
}
