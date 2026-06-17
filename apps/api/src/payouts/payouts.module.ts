import { Module } from '@nestjs/common';
import { BusinessesModule } from '../businesses/businesses.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PayoutsController } from './payouts.controller';
import { PayoutsService } from './payouts.service';

@Module({
  imports: [BusinessesModule, NotificationsModule],
  controllers: [PayoutsController],
  providers: [PayoutsService],
})
export class PayoutsModule {}
