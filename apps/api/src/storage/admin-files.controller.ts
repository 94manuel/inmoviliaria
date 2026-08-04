import { BadRequestException, Body, Controller, Get, Post, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CurrentUser, type JwtUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { FilesService } from './files.service.js';

const maxFileCount = Number(process.env.STORAGE_MAX_FILE_COUNT ?? 20);
const maxFileSize = Number(process.env.STORAGE_MAX_FILE_SIZE ?? 25_000_000);
const maxRequestSize = Number(process.env.STORAGE_MAX_REQUEST_SIZE ?? 70_000_000);

@Controller('admin/files')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminFilesController {
  constructor(private readonly files: FilesService) {}

  @Get()
  list() {
    return this.files.listAdmin();
  }

  @Post()
  @UseInterceptors(FilesInterceptor('files', maxFileCount, { storage: memoryStorage(), limits: { fileSize: maxFileSize } }))
  upload(
    @UploadedFiles() files: Express.Multer.File[] = [],
    @Body('folder') folder: string | undefined,
    @CurrentUser() user: JwtUser,
  ) {
    if (files.length === 0) throw new BadRequestException('Debe seleccionar al menos un archivo.');
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > maxRequestSize) {
      throw new BadRequestException('La carga completa no puede superar 70 MB.');
    }
    return this.files.uploadGeneric(files, user.sub, folder);
  }
}