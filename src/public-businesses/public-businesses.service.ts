
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BusinessProfile } from '../business-profile/business-profile.entity.js';
import { Product } from '../catalog/products/product.entity.js';
import { OrganizationModulesService } from '../organization-module/organization-module.service.js'; 

@Injectable()
export class PublicBusinessesService {
  constructor(
    @InjectRepository(BusinessProfile)
    private readonly profileRepository: Repository<BusinessProfile>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    private readonly organizationModulesService: OrganizationModulesService,
  ) {}

  async findPublished() {
  return this.buildPublishedBusinessesQuery()
    .orderBy('profile.createdAt', 'DESC')
    .getRawMany();
}

  async findPublishedById(businessId: string) {
  const business = await this.buildPublishedBusinessesQuery()
    .andWhere('profile.id = :businessId', {
      businessId,
    })
    .getRawOne();

  if (!business) {
    throw new NotFoundException('Negocio no encontrado');
  }

  return business;
}

  
async findPublicCatalog(businessId: string) {
  const business = await this.profileRepository.findOne({
    select: {
      id: true,
      tenantId: true,
    },
    where: {
      id: businessId,
      isPublished: true,
    },
  });

  if (!business) {
    throw new NotFoundException('Negocio no encontrado');
  }

  const catalogActive =
    await this.organizationModulesService.isModuleActive(
      business.tenantId,
      'catalog',
    );

  if (!catalogActive) {
    return {
      available: false,
      products: [],
    };
  }

  const products = await this.productRepository.find({
    select: {
      id: true,
      name: true,
      description: true,
      priceCents: true,
      imageUrl: true,
      agotado: true,
      category: {
        id: true,
        name: true,
      },
    },
    relations: {
      category: true,
    },
    where: {
      tenantId: business.tenantId,
      isVisibleInCatalog: true,
    },
    order: {
      name: 'ASC',
    },
  });

  return {
    available: true,
    products,
  };
}




  private buildPublishedBusinessesQuery() {
  return this.profileRepository
    .createQueryBuilder('profile')
    .innerJoin(
      'organization',
      'organization',
      'organization.id = profile.tenantId',
    )
    .select('profile.id', 'id')
    .addSelect('profile.tenantId', 'tenantId')
    .addSelect('organization.name', 'name')
    .addSelect('organization.slug', 'slug')
    .addSelect('organization.logo', 'logo')
    .addSelect('profile.businessType', 'businessType')
    .addSelect('profile.description', 'description')
    .addSelect('profile.address', 'address')
    .addSelect('profile.phone', 'phone')
    .addSelect('profile.photos', 'photos')
    .addSelect('profile.socialLinks', 'socialLinks')
    .addSelect('profile.openingHours', 'openingHours')
    .addSelect('profile.createdAt', 'createdAt')
    .where('profile.isPublished = :isPublished', {
      isPublished: true,
    });
}






}



