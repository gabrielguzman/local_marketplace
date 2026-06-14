import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { QuestionDto } from '@marketplace/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AccessTokenPayload } from '../auth/auth.types';
import { AnswerQuestionDto, AskQuestionDto } from './dto/questions.dto';
import { QuestionsService } from './questions.service';

@Controller('products/:id/questions')
export class QuestionsController {
  constructor(private readonly questions: QuestionsService) {}

  @Get()
  list(@Param('id', ParseUUIDPipe) id: string): Promise<QuestionDto[]> {
    return this.questions.list(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  ask(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AskQuestionDto,
  ): Promise<QuestionDto> {
    return this.questions.ask(user.sub, id, dto);
  }

  @Post(':questionId/answer')
  @UseGuards(JwtAuthGuard)
  answer(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('questionId', ParseUUIDPipe) questionId: string,
    @Body() dto: AnswerQuestionDto,
  ): Promise<QuestionDto> {
    return this.questions.answer(user.sub, id, questionId, dto);
  }
}
