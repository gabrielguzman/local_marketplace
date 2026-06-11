import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { CartDto } from '@marketplace/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AccessTokenPayload } from '../auth/auth.types';
import { CartService } from './cart.service';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart.dto';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  get(@CurrentUser() user: AccessTokenPayload): Promise<CartDto> {
    return this.cart.getCart(user.sub);
  }

  @Post('items')
  add(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: AddCartItemDto,
  ): Promise<CartDto> {
    return this.cart.addItem(user.sub, dto.variantId, dto.quantity);
  }

  @Patch('items/:id')
  update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCartItemDto,
  ): Promise<CartDto> {
    return this.cart.updateItem(user.sub, id, dto.quantity);
  }

  @Delete('items/:id')
  remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CartDto> {
    return this.cart.removeItem(user.sub, id);
  }
}
