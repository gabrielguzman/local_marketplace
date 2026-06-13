import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import type {
  AdminBusinessDto,
  AdminOrderDto,
  AdminProductDto,
  AdminStats,
  AdminUserDto,
  Page,
  ReportDto,
} from '@marketplace/shared';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { AdminGuard } from '../auth/admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AccessTokenPayload } from '../auth/auth.types';
import { AdminService } from './admin.service';

class ResolveReportDto {
  @IsIn(['RESOLVED', 'DISMISSED'])
  status!: 'RESOLVED' | 'DISMISSED';
}

class ModerateProductDto {
  @IsIn(['ACTIVE', 'PAUSED', 'DELETED'])
  status!: 'ACTIVE' | 'PAUSED' | 'DELETED';
}

class ModerateBusinessDto {
  @IsIn(['ACTIVE', 'SUSPENDED'])
  status!: 'ACTIVE' | 'SUSPENDED';
}

class ListReportsQuery {
  @IsOptional()
  @IsIn(['PENDING', 'RESOLVED', 'DISMISSED'])
  status?: 'PENDING' | 'RESOLVED' | 'DISMISSED';
}

class SearchQuery {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;
}

class PageQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;
}

class SetRoleDto {
  @IsIn(['USER', 'ADMIN'])
  role!: 'USER' | 'ADMIN';
}

class SetUserStatusDto {
  @IsIn(['ACTIVE', 'SUSPENDED'])
  status!: 'ACTIVE' | 'SUSPENDED';
}

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('stats')
  stats(): Promise<AdminStats> {
    return this.admin.stats();
  }

  @Get('reports')
  reports(@Query() query: ListReportsQuery): Promise<ReportDto[]> {
    return this.admin.listReports(query.status);
  }

  @Patch('reports/:id')
  resolve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveReportDto,
  ): Promise<ReportDto> {
    return this.admin.resolveReport(id, dto.status);
  }

  @Patch('products/:id/status')
  @HttpCode(204)
  async moderateProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ModerateProductDto,
  ): Promise<void> {
    await this.admin.setProductStatus(id, dto.status);
  }

  @Patch('businesses/:id/status')
  @HttpCode(204)
  async moderateBusiness(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ModerateBusinessDto,
  ): Promise<void> {
    await this.admin.setBusinessStatus(id, dto.status);
  }

  @Get('users')
  users(@Query() query: SearchQuery): Promise<Page<AdminUserDto>> {
    return this.admin.listUsers(query.q, query.page);
  }

  @Patch('users/:id/role')
  @HttpCode(204)
  async setRole(
    @CurrentUser() admin: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetRoleDto,
  ): Promise<void> {
    await this.admin.setUserRole(admin.sub, id, dto.role);
  }

  @Patch('users/:id/status')
  @HttpCode(204)
  async setUserStatus(
    @CurrentUser() admin: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetUserStatusDto,
  ): Promise<void> {
    await this.admin.setUserStatus(admin.sub, id, dto.status);
  }

  @Get('businesses')
  businesses(@Query() query: SearchQuery): Promise<Page<AdminBusinessDto>> {
    return this.admin.listBusinesses(query.q, query.page);
  }

  @Get('products')
  products(@Query() query: SearchQuery): Promise<Page<AdminProductDto>> {
    return this.admin.listProducts(query.q, query.page);
  }

  @Get('orders')
  orders(@Query() query: PageQuery): Promise<Page<AdminOrderDto>> {
    return this.admin.listOrders(query.page);
  }
}
