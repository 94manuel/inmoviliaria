import { Module } from '@nestjs/common';
import { PropertiesController } from './properties.controller.js';
import { AdminPropertiesController } from './admin-properties.controller.js';
import { PropertiesService } from './properties.service.js';

@Module({
  controllers: [PropertiesController, AdminPropertiesController],
  providers: [PropertiesService],
  exports: [PropertiesService],
})
export class PropertiesModule {}
