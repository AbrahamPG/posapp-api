
import { PartialType } from '@nestjs/mapped-types';
import { CreateBusinessProfileDto } from './create-business-profile.dto.js';

export class UpdateBusinessProfileDto extends PartialType(
  CreateBusinessProfileDto,
) {}
