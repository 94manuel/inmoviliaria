import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { AssignPropertyDto } from './dto/assign-property.dto.js';
import { CreateAdminUserDto } from './dto/create-admin-user.dto.js';
import { UsersService } from './users.service.js';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminUsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  list(@Query('search') search?: string) {
    return this.users.listAdmin(search);
  }

  @Post()
  create(@Body() dto: CreateAdminUserDto) {
    return this.users.createCustomer(dto);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.users.findAdminDetail(id);
  }

  @Post(':id/assign-property')
  assignProperty(@Param('id') id: string, @Body() dto: AssignPropertyDto) {
    return this.users.assignProperty(id, dto);
  }
}
