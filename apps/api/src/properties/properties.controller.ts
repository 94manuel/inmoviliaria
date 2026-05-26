import { Controller, Get, Param, Query } from '@nestjs/common';
import { PropertiesService } from './properties.service.js';
import { SearchPropertiesDto } from './dto/search-properties.dto.js';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly properties: PropertiesService) {}

  @Get('featured')
  featured() {
    return this.properties.featured();
  }

  @Get()
  list(@Query() query: SearchPropertiesDto) {
    return this.properties.listPublished(query);
  }

  @Get(':slug')
  detail(@Param('slug') slug: string) {
    return this.properties.findBySlug(slug);
  }
}
