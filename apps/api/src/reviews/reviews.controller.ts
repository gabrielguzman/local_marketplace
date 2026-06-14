import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { ReviewDto } from '@marketplace/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import type { AccessTokenPayload } from '../auth/auth.types';
import {
  CreateReportDto,
  CreateReviewDto,
  ReplyReviewDto,
  UpdateReviewDto,
} from './dto/reviews.dto';
import { ReviewsService } from './reviews.service';

@Controller('products/:id')
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get('reviews')
  @UseGuards(OptionalJwtAuthGuard)
  list(
    @CurrentUser() user: AccessTokenPayload | undefined,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ReviewDto[]> {
    return this.reviews.listForProduct(id, user?.sub);
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

  @Patch('reviews/:reviewId')
  @UseGuards(JwtAuthGuard)
  update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @Body() dto: UpdateReviewDto,
  ): Promise<ReviewDto> {
    return this.reviews.update(user.sub, id, reviewId, dto);
  }

  @Delete('reviews/:reviewId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
  ): Promise<void> {
    await this.reviews.remove(user.sub, id, reviewId);
  }

  @Post('reviews/:reviewId/reply')
  @UseGuards(JwtAuthGuard)
  reply(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
    @Body() dto: ReplyReviewDto,
  ): Promise<ReviewDto> {
    return this.reviews.respond(user.sub, id, reviewId, dto);
  }

  @Post('reviews/:reviewId/helpful')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  toggleHelpful(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
  ): Promise<{ helpfulCount: number; votedHelpful: boolean }> {
    return this.reviews.toggleHelpful(user.sub, id, reviewId);
  }

  @Post('reviews/:reviewId/report')
  @HttpCode(202)
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async reportReview(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
  ): Promise<{ ok: true }> {
    await this.reviews.reportReview(user.sub, id, reviewId);
    return { ok: true };
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
