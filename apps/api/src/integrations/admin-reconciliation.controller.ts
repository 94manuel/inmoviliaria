import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { BancolombiaReconciliationService } from './bancolombia-reconciliation.service.js';

@Controller('admin/reconciliation')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminReconciliationController {
  constructor(private readonly reconciliation: BancolombiaReconciliationService) {}

  @Get('notifications')
  notifications() {
    return this.reconciliation.listNotifications();
  }

  @Get('accounts')
  accounts() {
    return this.reconciliation.listAccounts();
  }

  @Get('imports')
  imports() {
    return this.reconciliation.listImportBatches();
  }
}
