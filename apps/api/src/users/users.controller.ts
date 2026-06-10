import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import type { UserDto } from '@marketplace/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AccessTokenPayload } from '../auth/auth.types';
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
}
