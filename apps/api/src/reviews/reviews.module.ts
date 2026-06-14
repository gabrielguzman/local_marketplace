import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module';
import { MyReviewsController } from './my-reviews.controller';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';

@Module({
  imports: [NotificationsModule],
  controllers: [ReviewsController, MyReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
