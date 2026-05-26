import { BadRequestException, Controller, Delete, Get, Param, Post, UploadedFiles, UseGuards, UseInterceptors, Body } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { CurrentUser, type JwtUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { CreatePropertyDto } from './dto/create-property.dto.js';
import { PropertiesService } from './properties.service.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const storage = diskStorage({
  destination: join(__dirname, '../../uploads'),
  filename: (_request, file, callback) => callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`),
});

@Controller('admin/properties')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminPropertiesController {
  constructor(private readonly properties: PropertiesService) {}

  @Get()
  list() {
    return this.properties.listAdmin();
  }

  @Post()
  @UseInterceptors(FilesInterceptor('photos', 10, { storage }))
  create(@Body() dto: CreatePropertyDto, @UploadedFiles() files: Express.Multer.File[] = [], @CurrentUser() user: JwtUser) {
    this.validateImages(files);
    return this.properties.create(dto, user.sub, files);
  }

  @Post(':id/images')
  @UseInterceptors(FilesInterceptor('photos', 10, { storage }))
  addImages(@Param('id') id: string, @UploadedFiles() files: Express.Multer.File[] = []) {
    this.validateImages(files, true);
    return this.properties.addImages(id, files);
  }

  @Delete(':id')
  archive(@Param('id') id: string) {
    return this.properties.archive(id);
  }

  private validateImages(files: Express.Multer.File[], required = false): void {
    if (required && files.length === 0) throw new BadRequestException('Debe subir al menos una imagen.');
    const invalid = files.find((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype) || file.size > 5_000_000);
    if (invalid) throw new BadRequestException('Las imágenes deben ser JPG, PNG o WEBP y pesar máximo 5 MB.');
  }
}
