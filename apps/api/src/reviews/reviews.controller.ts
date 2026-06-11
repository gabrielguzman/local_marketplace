import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { ReviewDto } from '@marketplace/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AccessTokenPayload } from '../auth/auth.types';
import { CreateReportDto, CreateReviewDto } from './dto/reviews.dto';
import { ReviewsService } from './reviews.service';

@Controller('products/:id')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get('reviews')
  list(@Param('id', ParseUUIDPipe) id: string): Promise<ReviewDto[]> {
    return this.reviews.listForProduct(id);
  }

  @Post('reviews')
  @UseGuards(JwtAuthGuard)
  create(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateReviewDto,
  ): Promise<ReviewDto> {
    return this.reviews.create(user.sub, id, dto);
  }

  @Post('report')
  @HttpCode(202)
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async report(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateReportDto,
  ): Promise<{ ok: true }> {
    await this.reviews.report(user.sub, id, dto);
    return { ok: true };
  }
}
