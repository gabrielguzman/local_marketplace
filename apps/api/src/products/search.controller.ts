import { Controller, Get, Query } from '@nestjs/common';
import type {
  Paginated,
  ProductSummaryDto,
  SearchFacets,
  SearchSuggestion,
} from '@marketplace/shared';
import { SearchQueryDto } from './dto/search-query.dto';
import { ProductsService } from './products.service';

@Controller('search')
export class SearchController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  search(
    @Query() query: SearchQueryDto,
  ): Promise<Paginated<ProductSummaryDto>> {
    return this.products.search(query);
  }

  @Get('suggest')
  suggest(@Query('q') q?: string): Promise<SearchSuggestion[]> {
    return this.products.suggest(q ?? '');
  }

  @Get('brands')
  brands(@Query('category') category?: string): Promise<string[]> {
    return this.products.brands(category);
  }

  // Facetas dinámicas (marcas + categorías) del resultado actual
  @Get('facets')
  facets(@Query() query: SearchQueryDto): Promise<SearchFacets> {
    return this.products.facets(query);
  }

  @Get('best-sellers')
  bestSellers(): Promise<ProductSummaryDto[]> {
    return this.products.bestSellers(8);
  }

  @Get('by-slugs')
  bySlugs(@Query('slugs') slugs?: string): Promise<ProductSummaryDto[]> {
    return this.products.bySlugs((slugs ?? '').split(',').filter(Boolean));
  }
}
