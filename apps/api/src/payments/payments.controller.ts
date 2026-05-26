import { Body, Controller, Headers, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, type JwtUser } from '../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { PaymentsService } from './payments.service.js';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('invoices/:invoiceId/intent')
  @UseGuards(JwtAuthGuard)
  createIntent(@Param('invoiceId') invoiceId: string, @CurrentUser() user: JwtUser) {
    return this.payments.createIntent(invoiceId, user.sub);
  }

  @Post('mock/:reference/approve')
  @UseGuards(JwtAuthGuard)
  approveMock(@Param('reference') reference: string, @CurrentUser() user: JwtUser) {
    return this.payments.approveMock(reference, user.sub);
  }

  @Post('wompi/webhook')
  webhook(@Body() event: unknown, @Headers('x-event-checksum') checksum?: string) {
    return this.payments.processWompiEvent(event as Parameters<PaymentsService['processWompiEvent']>[0], checksum);
  }
}
