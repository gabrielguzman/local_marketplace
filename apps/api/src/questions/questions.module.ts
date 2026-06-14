import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { MyQuestionsController } from './my-questions.controller';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';

@Module({
  imports: [NotificationsModule],
  controllers: [QuestionsController, MyQuestionsController],
  providers: [QuestionsService],
  exports: [QuestionsService],
})
export class QuestionsModule {}
