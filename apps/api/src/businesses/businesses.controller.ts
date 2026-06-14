import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { BusinessDto } from '@marketplace/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AccessTokenPayload } from '../auth/auth.types';
import { toBusinessDto } from './business.mapper';
import { BusinessesService } from './businesses.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

@Controller('businesses')
export class BusinessesController {
  constructor(private readonly businesses: BusinessesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreateBusinessDto,
  ): Promise<BusinessDto> {
    return toBusinessDto(await this.businesses.createForUser(user.sub, dto));
  }

  // Las rutas fijas van antes que :slug para que "me" no matchee como slug
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async mine(@CurrentUser() user: AccessTokenPayload): Promise<BusinessDto> {
    return toBusinessDto(await this.businesses.findMine(user.sub));
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async update(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: UpdateBusinessDto,
  ): Promise<BusinessDto> {
    return toBusinessDto(await this.businesses.updateMine(user.sub, dto));
  }

  @Get(':slug')
  async bySlug(@Param('slug') slug: string): Promise<BusinessDto> {
    const business = await this.businesses.findBySlug(slug);
    const [rating, stats] = await Promise.all([
      this.businesses.ratingFor(business.id),
      this.businesses.publicStats(business.id),
    ]);
    return toBusinessDto(business, rating, stats);
  }
}
