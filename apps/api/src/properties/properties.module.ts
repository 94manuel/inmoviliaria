import { Module } from '@nestjs/common';
import { PropertiesController } from './properties.controller.js';
import { AdminPropertiesController } from './admin-properties.controller.js';
import { PropertiesService } from './properties.service.js';
import { StorageModule } from '../storage/storage.module.js';

@Module({
  imports: [StorageModule],
  controllers: [PropertiesController, AdminPropertiesController],
  providers: [PropertiesService],
  exports: [PropertiesService],
})
export class PropertiesModule {}
