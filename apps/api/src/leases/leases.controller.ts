import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import { CurrentUser, type JwtUser } from '../common/decorators/current-user.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../common/guards/roles.guard.js';
import { LeasesService } from './leases.service.js';

const contractMaxFileSize = Number(process.env.CONTRACT_MAX_FILE_SIZE ?? 25_000_000);

@Controller()
export class LeasesController {
  constructor(private readonly leases: LeasesService) {}

  @Get('admin/leases')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  list() {
    return this.leases.listAdmin();
  }

  @Post('admin/leases/:id/contract')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: contractMaxFileSize } }))
  uploadContract(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: JwtUser,
  ) {
    if (!file) throw new BadRequestException('Debe seleccionar un contrato en PDF.');
    return this.leases.uploadContract(id, file, user.sub);
  }

  @Delete('admin/leases/:id/contract')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  removeContract(@Param('id') id: string) {
    return this.leases.removeContract(id);
  }

  @Get('leases/me')
  @UseGuards(JwtAuthGuard)
  mine(@CurrentUser() user: JwtUser) {
    return this.leases.listMine(user.sub);
  }

  @Get('leases/:id/contract')
  @UseGuards(JwtAuthGuard)
  async contractContent(
    @Param('id') id: string,
    @Query('download') download: string | undefined,
    @CurrentUser() user: JwtUser,
    @Res() response: Response,
  ) {
    await this.leases.sendContract(id, user, response, download === '1' || download === 'true');
  }
}
