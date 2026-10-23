
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BusinessProfile } from './business-profile.entity.js';
import { CreateBusinessProfileDto } from './dto/create-business-profile.dto.js';
import { UpdateBusinessProfileDto } from './dto/update-business-profile.dto.js';
import { OrganizationModulesService } from '../organization-module/organization-module.service.js';

@Injectable()
export class BusinessProfileService {
  constructor(
    @InjectRepository(BusinessProfile)
    private readonly profileRepository: Repository<BusinessProfile>,
    private readonly organizationModulesService: OrganizationModulesService,
  ) {}


  async getLimits(tenantId: string) {
  const catalogActive =
    await this.organizationModulesService.isModuleActive(
      tenantId,
      'catalog',
    );

  return {
    maxPhotos: catalogActive ? 15 : 5,
  };
}

  private async validatePhotoLimit(
    tenantId: string,
    photos?: string[] | null,
  ): Promise<void> {
    if (photos === undefined || photos === null) return;

    const catalogActive =
      await this.organizationModulesService.isModuleActive(
        tenantId,
        'catalog',
      );

    const maxPhotos = catalogActive ? 15 : 5;

    if (photos.length > maxPhotos) {
      throw new BadRequestException(
        `Tu plan permite un máximo de ${maxPhotos} fotos. ${
          catalogActive
            ? ''
            : 'Activa el módulo de catálogo para acceder al límite de 15 fotos.'
        }`,
      );
    }
  }

  async create(tenantId: string, dto: CreateBusinessProfileDto) {
    const existing = await this.profileRepository.findOne({
      where: { tenantId },
    });

    if (existing) {
      throw new ConflictException(
        'Esta organización ya tiene un perfil comercial',
      );
    }

    const profile = this.profileRepository.create({
      tenantId,
      businessType: dto.businessType,
      description: dto.description,
      address: dto.address,
      phone: dto.phone,
      coverImageUrl: dto.coverImageUrl,
      photos: dto.photos ?? [],
      socialLinks: dto.socialLinks,
      openingHours: dto.openingHours,
    });

    await this.validatePhotoLimit(tenantId, profile.photos);

    try {
      return await this.profileRepository.save(profile);
    } catch (error: unknown) {
      if (isPostgresUniqueViolation(error)) {
        throw new ConflictException(
          'Esta organización ya tiene un perfil comercial',
        );
      }

      throw error;
    }
  }

  async findMine(tenantId: string) {
    const profile = await this.profileRepository.findOne({
      where: { tenantId },
    });

    if (!profile) {
      throw new NotFoundException(
        'Esta organización todavía no tiene un perfil comercial',
      );
    }

    return profile;
  }

  async update(tenantId: string, dto: UpdateBusinessProfileDto) {
    const profile = await this.findMine(tenantId);

    await this.validatePhotoLimit(tenantId, dto.photos);

    if (dto.businessType !== undefined) {
      profile.businessType = dto.businessType;
    }

    if (dto.description !== undefined) {
      profile.description = dto.description;
    }

    if (dto.address !== undefined) {
      profile.address = dto.address;
    }

    if (dto.phone !== undefined) {
      profile.phone = dto.phone;
    }

    if (dto.coverImageUrl !== undefined) {
      profile.coverImageUrl = dto.coverImageUrl;
    }

    if (dto.photos !== undefined) {
      profile.photos = dto.photos;
    }

    if (dto.socialLinks !== undefined) {
      profile.socialLinks = dto.socialLinks;
    }

    if (dto.openingHours !== undefined) {
      profile.openingHours = dto.openingHours;
    }

    return this.profileRepository.save(profile);
  }

  // Publica la ficha comercial en IdentidadPEM.
  async publish(tenantId: string) {
    const profile = await this.findMine(tenantId);

    const missingFields: string[] = [];

    if (!profile.businessType?.trim()) {
      missingFields.push('tipo de negocio');
    }

    if (!profile.description?.trim()) {
      missingFields.push('descripción');
    }

    if (!profile.address?.trim()) {
      missingFields.push('dirección');
    }

    if (!profile.phone?.trim()) {
      missingFields.push('WhatsApp o teléfono de contacto');
    }

    if (missingFields.length > 0) {
      throw new BadRequestException({
        message:
          'Completa los datos obligatorios antes de publicar tu negocio.',
        missingFields,
      });
    }

    if (profile.isPublished) {
      return {
        message: 'Tu negocio ya está publicado en IdentidadPEM.',
        profile,
      };
    }

    profile.isPublished = true;

    const savedProfile = await this.profileRepository.save(profile);

    return {
      message: 'Tu negocio ya está publicado en IdentidadPEM.',
      profile: savedProfile,
    };
  }

  // Oculta la ficha pública sin eliminar los datos del negocio.
  async unpublish(tenantId: string) {
    const profile = await this.findMine(tenantId);

    if (!profile.isPublished) {
      return {
        message: 'Tu negocio ya está despublicado.',
        profile,
      };
    }

    profile.isPublished = false;

    const savedProfile = await this.profileRepository.save(profile);

    return {
      message: 'Tu negocio ya no aparece públicamente en IdentidadPEM.',
      profile: savedProfile,
    };
  }
}

function isPostgresUniqueViolation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;

  const candidate = error as {
    code?: unknown;
    driverError?: { code?: unknown };
  };

  return (
    candidate.code === '23505' ||
    candidate.driverError?.code === '23505'
  );
}
