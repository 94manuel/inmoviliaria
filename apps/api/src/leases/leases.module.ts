import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module.js';
import { LeasesController } from './leases.controller.js';
import { LeasesService } from './leases.service.js';

@Module({ imports: [StorageModule], controllers: [LeasesController], providers: [LeasesService] })
export class LeasesModule {}
