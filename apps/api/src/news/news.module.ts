import { Module } from '@nestjs/common';
import { AdminNewsController } from './admin-news.controller.js';
import { NewsController } from './news.controller.js';
import { NewsService } from './news.service.js';

@Module({
  controllers: [NewsController, AdminNewsController],
  providers: [NewsService],
  exports: [NewsService],
})
export class NewsModule {}