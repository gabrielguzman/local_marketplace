import { Controller, Get, Query } from '@nestjs/common';
import type {
  Paginated,
  ProductSummaryDto,
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
}
