import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, type JwtUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { CreateInvoiceDto } from './dto/create-invoice.dto.js';
import { InvoicesService } from './invoices.service.js';

@Controller()
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}

  @Get('invoices/me')
  @UseGuards(JwtAuthGuard)
  mine(@CurrentUser() user: JwtUser) {
    return this.invoices.listMine(user.sub);
  }

  @Get('invoices/me/:id')
  @UseGuards(JwtAuthGuard)
  detail(@Param('id') id: string, @CurrentUser() user: JwtUser) {
    return this.invoices.findMine(id, user.sub);
  }

  @Get('admin/invoices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  adminList() {
    return this.invoices.listAdmin();
  }

  @Post('admin/invoices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(@Body() dto: CreateInvoiceDto) {
    return this.invoices.create(dto);
  }
}
