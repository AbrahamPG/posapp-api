
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrganizationModule } from './organization-module.entity.js';

export type ModuleKey = 'catalog' | 'pos';

@Injectable()
export class OrganizationModulesService {
  constructor(
    @InjectRepository(OrganizationModule)
    private readonly organizationModuleRepository: Repository<OrganizationModule>,
  ) {}

  async isModuleActive(
    tenantId: string,
    moduleKey: ModuleKey,
  ): Promise<boolean> {
    const now = new Date();

    const organizationModule =
      await this.organizationModuleRepository
        .createQueryBuilder('module')
        .where('module.tenantId = :tenantId', { tenantId })
        .andWhere('module.moduleKey = :moduleKey', { moduleKey })
        .andWhere('module.isEnabled = :isEnabled', { isEnabled: true })
        .andWhere('module.startsAt <= :now', { now })
        .andWhere(
          '(module.expiresAt IS NULL OR module.expiresAt > :now)',
          { now },
        )
        .getOne();

    return organizationModule !== null;
  }

  async activateModule(
    tenantId: string,
    moduleKey: ModuleKey,
    durationDays: number,
    activatedBy: string,
  ): Promise<OrganizationModule> {
    if (!Number.isInteger(durationDays) || durationDays < 1) {
      throw new Error('durationDays debe ser un entero mayor que cero');
    }

    const now = new Date();

    let record = await this.organizationModuleRepository.findOne({
      where: { tenantId, moduleKey },
    });

    if (!record) {
      record = this.organizationModuleRepository.create({
        tenantId,
        moduleKey,
        isEnabled: true,
        startsAt: now,
        expiresAt: new Date(
          now.getTime() + durationDays * 24 * 60 * 60 * 1000,
        ),
        activatedBy,
      });
    } else {
      const currentExpiry = record.expiresAt;

      const baseDate =
        currentExpiry && currentExpiry > now && record.isEnabled
          ? currentExpiry
          : now;

      record.isEnabled = true;
      record.startsAt = now;
      record.expiresAt = new Date(
        baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000,
      );
      record.activatedBy = activatedBy;
    }

    return this.organizationModuleRepository.save(record);
  }

  async deactivateModule(
    tenantId: string,
    moduleKey: ModuleKey,
  ): Promise<OrganizationModule> {
    const record = await this.organizationModuleRepository.findOne({
      where: { tenantId, moduleKey },
    });

    if (!record) {
      throw new NotFoundException('La organización no tiene ese módulo registrado');
    }

    record.isEnabled = false;

    return this.organizationModuleRepository.save(record);
  }

  async getModulesByOrganization(
    tenantId: string,
    ): Promise<OrganizationModule[]> {
    return this.organizationModuleRepository.find({
        where: { tenantId },
        order: { moduleKey: 'ASC' },
    });
    }


}





