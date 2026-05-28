import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, type JwtUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { CreateNewsPostDto } from './dto/create-news-post.dto.js';
import { NewsService } from './news.service.js';

@Controller('admin/news')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminNewsController {
  constructor(private readonly news: NewsService) {}

  @Get()
  list() {
    return this.news.listAdmin();
  }

  @Post()
  create(@Body() dto: CreateNewsPostDto, @CurrentUser() user: JwtUser) {
    return this.news.create(dto, user.sub);
  }

  @Delete(':id')
  archive(@Param('id') id: string) {
    return this.news.archive(id);
  }
}