import { BadRequestException, Body, Controller, Delete, Get, Param, Post, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CurrentUser, type JwtUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { CreatePropertyDto } from './dto/create-property.dto.js';
import { PropertiesService } from './properties.service.js';

const maxImageSize = Number(process.env.PROPERTY_IMAGE_MAX_FILE_SIZE ?? 5_000_000);
const storage = memoryStorage();

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
  @UseInterceptors(FilesInterceptor('photos', 10, { storage, limits: { fileSize: maxImageSize } }))
  create(@Body() dto: CreatePropertyDto, @UploadedFiles() files: Express.Multer.File[] = [], @CurrentUser() user: JwtUser) {
    this.validateImages(files);
    return this.properties.create(dto, user.sub, files);
  }

  @Post(':id/images')
  @UseInterceptors(FilesInterceptor('photos', 10, { storage, limits: { fileSize: maxImageSize } }))
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
    const invalid = files.find((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype) || file.size > maxImageSize);
    if (invalid) throw new BadRequestException('Las imágenes deben ser JPG, PNG o WEBP y pesar máximo 5 MB.');
  }
}
