import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ContactsService } from './contacts.service.js';
import { CreateContactDto } from './dto/create-contact.dto.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';

@Controller()
export class ContactsController {
  constructor(private readonly contacts: ContactsService) {}

  @Post('contacts')
  create(@Body() dto: CreateContactDto) {
    return this.contacts.create(dto);
  }

  @Get('admin/contacts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  list() {
    return this.contacts.list();
  }
}
