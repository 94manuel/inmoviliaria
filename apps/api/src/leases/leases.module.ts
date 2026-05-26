import { Module } from '@nestjs/common';
import { LeasesController } from './leases.controller.js';
import { LeasesService } from './leases.service.js';

@Module({ controllers: [LeasesController], providers: [LeasesService] })
export class LeasesModule {}
