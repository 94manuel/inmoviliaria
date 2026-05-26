import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateContactDto } from './dto/create-contact.dto.js';

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateContactDto) {
    return this.prisma.contactMessage.create({ data: dto });
  }

  list() {
    return this.prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' } });
  }
}
