import { Module } from '@nestjs/common';
import { ContentController, ContentProgressController, AdminContentController } from './content.controller';
import { ContentService } from './content.service';

@Module({
  controllers: [ContentController, ContentProgressController, AdminContentController],
  providers: [ContentService],
  exports: [ContentService],
})
export class ContentModule {}
