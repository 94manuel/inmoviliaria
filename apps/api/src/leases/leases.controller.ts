import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { LeasesService } from './leases.service.js';

@Controller('admin/leases')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class LeasesController {
  constructor(private readonly leases: LeasesService) {}

  @Get()
  list() {
    return this.leases.listAdmin();
  }
}
