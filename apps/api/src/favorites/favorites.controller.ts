import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import type { ProductSummaryDto } from '@marketplace/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AccessTokenPayload } from '../auth/auth.types';
import { FavoritesService } from './favorites.service';

@Controller('me/favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Get()
  list(@CurrentUser() user: AccessTokenPayload): Promise<ProductSummaryDto[]> {
    return this.favorites.list(user.sub);
  }

  @Get('ids')
  ids(@CurrentUser() user: AccessTokenPayload): Promise<string[]> {
    return this.favorites.ids(user.sub);
  }

  @Put(':productId')
  @HttpCode(204)
  async add(
    @CurrentUser() user: AccessTokenPayload,
    @Param('productId', ParseUUIDPipe) productId: string,
  ): Promise<void> {
    await this.favorites.add(user.sub, productId);
  }

  @Delete(':productId')
  @HttpCode(204)
  async remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('productId', ParseUUIDPipe) productId: string,
  ): Promise<void> {
    await this.favorites.remove(user.sub, productId);
  }
}
