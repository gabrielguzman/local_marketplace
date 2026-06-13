import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Patch,
  Put,
  UseGuards,
} from '@nestjs/common';
import type { UserDto } from '@marketplace/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AccessTokenPayload } from '../auth/auth.types';
import { ChangePasswordDto, DeleteAccountDto } from './dto/account.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { toUserDto } from './user.mapper';
import { UsersService } from './users.service';

@Controller('me')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  async me(@CurrentUser() user: AccessTokenPayload): Promise<UserDto> {
    return toUserDto(await this.users.findById(user.sub));
  }

  @Patch()
  async update(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: UpdateMeDto,
  ): Promise<UserDto> {
    return toUserDto(await this.users.update(user.sub, dto));
  }

  @Put('password')
  @HttpCode(204)
  async changePassword(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    await this.users.changePassword(user.sub, dto);
  }

  @Delete()
  @HttpCode(204)
  async remove(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: DeleteAccountDto,
  ): Promise<void> {
    await this.users.deleteAccount(user.sub, dto);
  }
}
