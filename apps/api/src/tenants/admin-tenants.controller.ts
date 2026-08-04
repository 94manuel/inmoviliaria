import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { TenantsService } from './tenants.service.js';

@Controller('admin/tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminTenantsController {
  constructor(private readonly tenants: TenantsService) {}

  @Get()
  list(@Query('search') search?: string) {
    return this.tenants.listAdmin(search);
  }
}
