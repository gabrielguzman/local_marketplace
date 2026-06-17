import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import type {
  AdminPayoutsView,
  PayoutDto,
  SellerPayoutSummary,
} from '@marketplace/shared';
import { AdminGuard } from '../auth/admin.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AccessTokenPayload } from '../auth/auth.types';
import { PayoutsService } from './payouts.service';

class CreatePayoutDto {
  @IsUUID()
  businessId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  note?: string;
}

@Controller()
@UseGuards(JwtAuthGuard)
export class PayoutsController {
  constructor(private readonly payouts: PayoutsService) {}

  // Vendedor: resumen de sus cobros
  @Get('businesses/me/payouts')
  mySummary(
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<SellerPayoutSummary> {
    return this.payouts.sellerSummary(user.sub);
  }

  // Admin: saldos a pagar por negocio + historial
  @Get('admin/payouts')
  @UseGuards(AdminGuard)
  adminView(): Promise<AdminPayoutsView> {
    return this.payouts.adminView();
  }

  // Admin: registra el pago de la liquidación de un negocio
  @Post('admin/payouts')
  @UseGuards(AdminGuard)
  create(@Body() dto: CreatePayoutDto): Promise<PayoutDto> {
    return this.payouts.createPayout(dto.businessId, dto.note);
  }
}
