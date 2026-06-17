import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { MessageThread } from '@marketplace/shared';
import type { Prisma } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

const SUBORDER_PARTIES = {
  order: {
    select: { id: true, buyerId: true, buyer: { select: { name: true } } },
  },
  business: { select: { name: true, ownerId: true } },
} satisfies Prisma.SubOrderInclude;

type SubOrderParties = Prisma.SubOrderGetPayload<{
  include: typeof SUBORDER_PARTIES;
}>;

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  // Verifica que el usuario sea el comprador o el vendedor de la sub-orden
  private async authorize(
    userId: string,
    subOrderId: string,
  ): Promise<{ sub: SubOrderParties; role: 'BUYER' | 'SELLER' }> {
    const sub = await this.prisma.subOrder.findUnique({
      where: { id: subOrderId },
      include: SUBORDER_PARTIES,
    });
    if (!sub) {
      throw new NotFoundException({
        code: 'SUBORDER_NOT_FOUND',
        message: 'Venta no encontrada',
      });
    }
    if (sub.order.buyerId === userId) return { sub, role: 'BUYER' };
    if (sub.business.ownerId === userId) return { sub, role: 'SELLER' };
    throw new ForbiddenException({
      code: 'NOT_A_PARTICIPANT',
      message: 'No participás de esta conversación',
    });
  }

  // Hilo completo; marca como leídos los mensajes que recibió el usuario
  async getThread(userId: string, subOrderId: string): Promise<MessageThread> {
    const { sub, role } = await this.authorize(userId, subOrderId);

    await this.prisma.message.updateMany({
      where: { subOrderId, senderId: { not: userId }, readAt: null },
      data: { readAt: new Date() },
    });

    const messages = await this.prisma.message.findMany({
      where: { subOrderId },
      include: { sender: { select: { name: true } } },
      orderBy: { createdAt: 'asc' },
    });

    return {
      subOrderId,
      counterpartyName:
        role === 'BUYER' ? sub.business.name : sub.order.buyer.name,
      messages: messages.map((m) => ({
        id: m.id,
        body: m.body,
        mine: m.senderId === userId,
        senderName: m.sender.name,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  }

  async send(
    userId: string,
    subOrderId: string,
    body: string,
  ): Promise<MessageThread> {
    const { sub, role } = await this.authorize(userId, subOrderId);

    await this.prisma.message.create({
      data: { subOrderId, senderId: userId, body: body.trim() },
    });

    // notificar al otro participante
    const recipientId =
      role === 'BUYER' ? sub.business.ownerId : sub.order.buyerId;
    const link =
      role === 'BUYER' ? '/vender/ventas' : `/compras/${sub.order.id}`;
    await this.notifications.notify({
      userId: recipientId,
      type: 'MESSAGE',
      title: 'Nuevo mensaje sobre una compra',
      body: body.trim().slice(0, 80),
      link,
    });

    return this.getThread(userId, subOrderId);
  }
}
