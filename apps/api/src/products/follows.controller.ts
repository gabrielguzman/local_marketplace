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
import { BusinessesService } from '../businesses/businesses.service';
import { ProductsService } from './products.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class FollowsController {
  constructor(
    private readonly businesses: BusinessesService,
    private readonly products: ProductsService,
  ) {}

  @Put('businesses/:id/follow')
  @HttpCode(204)
  async follow(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.businesses.follow(user.sub, id);
  }

  @Delete('businesses/:id/follow')
  @HttpCode(204)
  async unfollow(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.businesses.unfollow(user.sub, id);
  }

  // ids de las tiendas que sigo (para marcar botones)
  @Get('me/following/ids')
  ids(@CurrentUser() user: AccessTokenPayload): Promise<string[]> {
    return this.businesses.followingIds(user.sub);
  }

  // feed de novedades: últimos productos de las tiendas que sigo
  @Get('me/following/feed')
  async feed(
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<ProductSummaryDto[]> {
    const ids = await this.businesses.followingIds(user.sub);
    return this.products.feedForBusinesses(ids);
  }
}
