import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { CartDto } from '@marketplace/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import type { AccessTokenPayload } from '../auth/auth.types';
import { CartService, type CartOwner } from './cart.service';
import {
  AddCartItemDto,
  MergeCartDto,
  UpdateCartItemDto,
} from './dto/cart.dto';

// El dueño del carrito sale del Bearer (usuario) o del header X-Guest-Cart
// (invitado), que el front mantiene en una cookie httpOnly.
function resolveOwner(
  user: AccessTokenPayload | undefined,
  guestToken: string | undefined,
): CartOwner {
  if (user) return { userId: user.sub };
  if (guestToken) return { guestToken };
  throw new BadRequestException({
    code: 'NO_CART_IDENTITY',
    message: 'Falta identificar el carrito',
  });
}

@Controller('cart')
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  get(
    @CurrentUser() user: AccessTokenPayload | undefined,
    @Headers('x-guest-cart') guestToken?: string,
  ): Promise<CartDto> {
    return this.cart.getCart(resolveOwner(user, guestToken));
  }

  @Post('items')
  @UseGuards(OptionalJwtAuthGuard)
  add(
    @CurrentUser() user: AccessTokenPayload | undefined,
    @Body() dto: AddCartItemDto,
    @Headers('x-guest-cart') guestToken?: string,
  ): Promise<CartDto> {
    return this.cart.addItem(
      resolveOwner(user, guestToken),
      dto.variantId,
      dto.quantity,
    );
  }

  @Patch('items/:id')
  @UseGuards(OptionalJwtAuthGuard)
  update(
    @CurrentUser() user: AccessTokenPayload | undefined,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCartItemDto,
    @Headers('x-guest-cart') guestToken?: string,
  ): Promise<CartDto> {
    return this.cart.updateItem(
      resolveOwner(user, guestToken),
      id,
      dto.quantity,
    );
  }

  @Delete('items/:id')
  @UseGuards(OptionalJwtAuthGuard)
  remove(
    @CurrentUser() user: AccessTokenPayload | undefined,
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('x-guest-cart') guestToken?: string,
  ): Promise<CartDto> {
    return this.cart.removeItem(resolveOwner(user, guestToken), id);
  }

  // Vuelca el carrito de invitado en el del usuario (al loguearse).
  @Post('merge')
  @UseGuards(JwtAuthGuard)
  merge(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: MergeCartDto,
  ): Promise<CartDto> {
    return this.cart.mergeGuestIntoUser(user.sub, dto.guestToken);
  }
}
