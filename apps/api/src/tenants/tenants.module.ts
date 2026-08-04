import { Module } from '@nestjs/common';
import { AdminTenantsController } from './admin-tenants.controller.js';
import { TenantsService } from './tenants.service.js';

@Module({
  controllers: [AdminTenantsController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}
