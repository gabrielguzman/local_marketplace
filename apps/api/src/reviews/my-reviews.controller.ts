import { Controller, Get, UseGuards } from '@nestjs/common';
import type { MyReviewDto } from '@marketplace/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AccessTokenPayload } from '../auth/auth.types';
import { ReviewsService } from './reviews.service';

@Controller('me/reviews')
@UseGuards(JwtAuthGuard)
export class MyReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Get()
  list(@CurrentUser() user: AccessTokenPayload): Promise<MyReviewDto[]> {
    return this.reviews.listMine(user.sub);
  }
}
