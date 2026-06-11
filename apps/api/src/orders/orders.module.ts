import { Module } from '@nestjs/common';
import { BusinessesModule } from '../businesses/businesses.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [BusinessesModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
