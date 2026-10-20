
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BusinessProfile } from './business-profile.entity.js';
import { CreateBusinessProfileDto } from './dto/create-business-profile.dto.js';
import { UpdateBusinessProfileDto } from './dto/update-business-profile.dto.js';

@Injectable()
export class BusinessProfileService {
  constructor(
    @InjectRepository(BusinessProfile)
    private readonly profileRepository: Repository<BusinessProfile>,
  ) {}

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

    try {
      return await this.profileRepository.save(profile);
    } catch (error: unknown) {
      // La restricción UNIQUE también protege frente a solicitudes simultáneas.
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

    // Solo actualizamos campos permitidos explícitamente.
    if (dto.businessType !== undefined) profile.businessType = dto.businessType;
    if (dto.description !== undefined) profile.description = dto.description;
    if (dto.address !== undefined) profile.address = dto.address;
    if (dto.phone !== undefined) profile.phone = dto.phone;
    if (dto.coverImageUrl !== undefined) profile.coverImageUrl = dto.coverImageUrl;
    if (dto.photos !== undefined) profile.photos = dto.photos;
    if (dto.socialLinks !== undefined) profile.socialLinks = dto.socialLinks;
    if (dto.openingHours !== undefined) profile.openingHours = dto.openingHours;

    return this.profileRepository.save(profile);
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
