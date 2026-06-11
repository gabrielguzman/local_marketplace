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
import type { AdminStats, ReportDto } from '@marketplace/shared';
import { IsIn, IsOptional } from 'class-validator';
import { AdminGuard } from '../auth/admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
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
}
