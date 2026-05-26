import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { DashboardService } from './dashboard.service.js';

@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  metrics() {
    return this.dashboard.metrics();
  }
}
