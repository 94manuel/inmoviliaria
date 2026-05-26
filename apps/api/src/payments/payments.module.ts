import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller.js';
import { PaymentsService } from './payments.service.js';
import { InvoicesModule } from '../invoices/invoices.module.js';

@Module({ imports: [InvoicesModule], controllers: [PaymentsController], providers: [PaymentsService] })
export class PaymentsModule {}
