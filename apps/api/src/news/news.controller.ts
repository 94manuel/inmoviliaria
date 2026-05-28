import { Controller, Get, Param } from '@nestjs/common';
import { NewsService } from './news.service.js';

@Controller('news')
export class NewsController {
  constructor(private readonly news: NewsService) {}

  @Get('featured')
  featured() {
    return this.news.featured();
  }

  @Get()
  list() {
    return this.news.listPublished();
  }

  @Get(':slug')
  detail(@Param('slug') slug: string) {
    return this.news.findBySlug(slug);
  }
}