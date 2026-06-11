import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { OrderDto, SellerSubOrderDto } from '@marketplace/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AccessTokenPayload } from '../auth/auth.types';
import { CheckoutDto, UpdateSubOrderStatusDto } from './dto/orders.dto';
import { OrdersService } from './orders.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post('checkout')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  checkout(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CheckoutDto,
  ): Promise<OrderDto> {
    return this.orders.checkout(user.sub, dto);
  }

  @Get('orders')
  list(@CurrentUser() user: AccessTokenPayload): Promise<OrderDto[]> {
    return this.orders.listMyOrders(user.sub);
  }

  @Get('orders/:id')
  get(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OrderDto> {
    return this.orders.getMyOrder(user.sub, id);
  }

  @Post('orders/:id/pay')
  @HttpCode(200)
  pay(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OrderDto> {
    return this.orders.payOrder(user.sub, id);
  }

  @Get('businesses/me/suborders')
  sales(@CurrentUser() user: AccessTokenPayload): Promise<SellerSubOrderDto[]> {
    return this.orders.listMySales(user.sub);
  }

  @Patch('suborders/:id/status')
  updateStatus(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSubOrderStatusDto,
  ): Promise<SellerSubOrderDto> {
    return this.orders.updateSubOrderStatus(user.sub, id, dto.status);
  }
}
