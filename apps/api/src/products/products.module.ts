import { Module } from '@nestjs/common';
import { BusinessesModule } from '../businesses/businesses.module';
import { CategoriesModule } from '../categories/categories.module';
import { FollowsController } from './follows.controller';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { SearchController } from './search.controller';

@Module({
  imports: [BusinessesModule, CategoriesModule],
  controllers: [ProductsController, SearchController, FollowsController],
  providers: [ProductsService],
})
export class ProductsModule {}
