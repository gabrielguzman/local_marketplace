import { Controller, Get, UseGuards } from '@nestjs/common';
import type { MyQuestionDto } from '@marketplace/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AccessTokenPayload } from '../auth/auth.types';
import { QuestionsService } from './questions.service';

@Controller('me/questions')
@UseGuards(JwtAuthGuard)
export class MyQuestionsController {
  constructor(private readonly questions: QuestionsService) {}

  @Get()
  list(@CurrentUser() user: AccessTokenPayload): Promise<MyQuestionDto[]> {
    return this.questions.listMine(user.sub);
  }
}
