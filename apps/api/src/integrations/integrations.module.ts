import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AdminReconciliationController } from './admin-reconciliation.controller.js';
import { BancolombiaReconciliationService } from './bancolombia-reconciliation.service.js';
import { LegacyN8nPaymentsController, N8nBancolombiaController } from './n8n-reconciliation.controller.js';
import { N8nApiKeyGuard } from './guards/n8n-api-key.guard.js';

@Module({
  imports: [PrismaModule],
  controllers: [N8nBancolombiaController, LegacyN8nPaymentsController, AdminReconciliationController],
  providers: [BancolombiaReconciliationService, N8nApiKeyGuard],
})
export class IntegrationsModule {}
