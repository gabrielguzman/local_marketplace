import { Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import type { NotificationsResponse } from '@marketplace/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AccessTokenPayload } from '../auth/auth.types';
import { NotificationsService } from './notifications.service';

@Controller('me/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<NotificationsResponse> {
    return this.notifications.list(user.sub);
  }

  @Get('unread-count')
  async unread(
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<{ count: number }> {
    return { count: await this.notifications.unreadCount(user.sub) };
  }

  @Post('read')
  @HttpCode(204)
  async markAllRead(@CurrentUser() user: AccessTokenPayload): Promise<void> {
    await this.notifications.markAllRead(user.sub);
  }
}
