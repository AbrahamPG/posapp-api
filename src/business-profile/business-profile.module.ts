
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BusinessProfile } from './business-profile.entity.js';
import { BusinessProfileController } from './business-profile.controller.js';
import { BusinessProfileService } from './business-profile.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([BusinessProfile])],
  controllers: [BusinessProfileController],
  providers: [BusinessProfileService],
  exports: [BusinessProfileService],
})
export class BusinessProfileModule {}
