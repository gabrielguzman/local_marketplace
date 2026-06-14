import { Injectable } from '@nestjs/common';
import type {
  NotificationDto,
  NotificationsResponse,
} from '@marketplace/shared';
import type { Notification, NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

function toDto(n: Notification): NotificationDto {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    link: n.link,
    read: n.readAt !== null,
    createdAt: n.createdAt.toISOString(),
  };
}

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  // Crea una notificación (no rompe la acción que la dispara si falla)
  async notify(input: {
    userId: string;
    type: NotificationType;
    title: string;
    body?: string;
    link?: string;
  }): Promise<void> {
    await this.prisma.notification
      .create({
        data: {
          userId: input.userId,
          type: input.type,
          title: input.title,
          body: input.body ?? '',
          link: input.link ?? null,
        },
      })
      .catch(() => undefined);
  }

  async list(userId: string): Promise<NotificationsResponse> {
    const [items, unreadCount] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);
    return { items: items.map(toDto), unreadCount };
  }

  async unreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { userId, readAt: null } });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }
}
