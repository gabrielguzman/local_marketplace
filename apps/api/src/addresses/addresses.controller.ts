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
import type { AddressDto } from '@marketplace/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AccessTokenPayload } from '../auth/auth.types';
import { toAddressDto } from './address.mapper';
import { AddressesService } from './addresses.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

@Controller('me/addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(private readonly addresses: AddressesService) {}

  @Get()
  async list(@CurrentUser() user: AccessTokenPayload): Promise<AddressDto[]> {
    const list = await this.addresses.list(user.sub);
    return list.map(toAddressDto);
  }

  @Post()
  async create(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: CreateAddressDto,
  ): Promise<AddressDto> {
    return toAddressDto(await this.addresses.create(user.sub, dto));
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAddressDto,
  ): Promise<AddressDto> {
    return toAddressDto(await this.addresses.update(user.sub, id, dto));
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @CurrentUser() user: AccessTokenPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.addresses.remove(user.sub, id);
  }
}
