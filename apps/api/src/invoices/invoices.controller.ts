import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, type JwtUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { CreateInvoiceDto } from './dto/create-invoice.dto.js';
import { DeleteInvoiceDto } from './dto/delete-invoice.dto.js';
import { UpdateInvoiceDto } from './dto/update-invoice.dto.js';
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

  @Get('admin/invoices/catalog')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  catalog() {
    return this.invoices.listCatalog();
  }

  @Post('admin/invoices')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(@Body() dto: CreateInvoiceDto) {
    return this.invoices.create(dto);
  }

  @Patch('admin/invoices/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateInvoiceDto) {
    return this.invoices.update(id, dto);
  }

  @Delete('admin/invoices/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string, @Body() dto: DeleteInvoiceDto) {
    return this.invoices.remove(id, dto);
  }
}
