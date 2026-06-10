import { Controller, Get } from '@nestjs/common';
import type { CategoryDto } from '@marketplace/shared';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  tree(): Promise<CategoryDto[]> {
    return this.categories.tree();
  }
}
