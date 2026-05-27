import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { FilesService } from './files.service.js';

@Controller('files')
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.files.getPublicMetadata(id);
  }

  @Get(':id/content')
  async content(
    @Param('id') id: string,
    @Query('download') download: string | undefined,
    @Res() response: Response,
  ) {
    await this.files.sendContent(id, response, download === '1' || download === 'true');
  }
}