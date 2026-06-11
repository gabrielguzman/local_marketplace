import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { ProductDetailDto } from '@marketplace/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AccessTokenPayload } from '../auth/auth.types';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto, UpdateVariantDto } from './dto/update-product.dto';
import { toProductDetailDto } from './product.mapper';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreateProductDto,
  ): Promise<ProductDetailDto> {
    return toProductDetailDto(await this.products.createForUser(user.sub, dto));
  }

  // Fija antes que :slug
  @Get('mine')
  @UseGuards(JwtAuthGuard)
  async mine(
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<ProductDetailDto[]> {
    const products = await this.products.listMine(user.sub);
    return products.map(toProductDetailDto);
  }

  @Get(':slug')
  async bySlug(@Param('slug') slug: string): Promise<ProductDetailDto> {
    return toProductDetailDto(await this.products.findPublicBySlug(slug));
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductDetailDto> {
    return toProductDetailDto(await this.products.update(user.sub, id, dto));
  }

  @Patch(':id/variants/:variantId')
  @UseGuards(JwtAuthGuard)
  async updateVariant(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Body() dto: UpdateVariantDto,
  ): Promise<ProductDetailDto> {
    return toProductDetailDto(
      await this.products.updateVariant(user.sub, id, variantId, dto),
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.products.softDelete(user.sub, id);
  }
}
