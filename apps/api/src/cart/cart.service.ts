import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CartDto, CartItemDto, Currency } from '@marketplace/shared';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const ITEM_INCLUDE = {
  variant: {
    include: {
      product: {
        include: {
          business: { select: { id: true, name: true, slug: true } },
          images: true,
        },
      },
    },
  },
} satisfies Prisma.CartItemInclude;

type ItemWithRelations = Prisma.CartItemGetPayload<{
  include: typeof ITEM_INCLUDE;
}>;

function toCartItemDto(item: ItemWithRelations): CartItemDto {
  const { variant } = item;
  const { product } = variant;
  const image = [...product.images].sort((a, b) => a.position - b.position)[0];
  return {
    id: item.id,
    quantity: item.quantity,
    variant: {
      id: variant.id,
      priceCents: variant.priceCents,
      currency: variant.currency as Currency,
      attributes: (variant.attributes ?? {}) as Record<string, string>,
      stock: variant.stock,
    },
    product: {
      id: product.id,
      title: product.title,
      slug: product.slug,
      status: product.status,
      imageUrl: image?.url ?? null,
    },
    business: product.business,
  };
}

// El dueño de un carrito: usuario logueado o invitado anónimo
export type CartOwner = { userId: string } | { guestToken: string };

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(owner: CartOwner): Promise<CartDto> {
    const cart = await this.prisma.cart.findUnique({
      where: owner,
      include: { items: { include: ITEM_INCLUDE } },
    });
    const items = (cart?.items ?? [])
      .map(toCartItemDto)
      .filter((i) => i.product.status === 'ACTIVE');
    return {
      items,
      totalCents: items.reduce(
        (sum, i) => sum + i.variant.priceCents * i.quantity,
        0,
      ),
      currency: 'ARS',
    };
  }

  async addItem(
    owner: CartOwner,
    variantId: string,
    quantity: number,
  ): Promise<CartDto> {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: { select: { status: true } } },
    });
    if (!variant || variant.product.status !== 'ACTIVE') {
      throw new NotFoundException({
        code: 'VARIANT_NOT_FOUND',
        message: 'El producto ya no está disponible',
      });
    }

    const cart = await this.prisma.cart.upsert({
      where: owner,
      update: {},
      create: owner,
    });

    const existing = await this.prisma.cartItem.findUnique({
      where: { cartId_variantId: { cartId: cart.id, variantId } },
    });
    const newQuantity = (existing?.quantity ?? 0) + quantity;
    this.assertStock(variant.stock, newQuantity);

    await this.prisma.cartItem.upsert({
      where: { cartId_variantId: { cartId: cart.id, variantId } },
      update: { quantity: newQuantity },
      create: { cartId: cart.id, variantId, quantity },
    });
    return this.getCart(owner);
  }

  async updateItem(
    owner: CartOwner,
    itemId: string,
    quantity: number,
  ): Promise<CartDto> {
    const item = await this.findOwnItem(owner, itemId);
    this.assertStock(item.variant.stock, quantity);
    await this.prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity },
    });
    return this.getCart(owner);
  }

  async removeItem(owner: CartOwner, itemId: string): Promise<CartDto> {
    const item = await this.findOwnItem(owner, itemId);
    await this.prisma.cartItem.delete({ where: { id: item.id } });
    return this.getCart(owner);
  }

  // Al loguearse, vuelca el carrito de invitado en el del usuario.
  // Suma cantidades (clampeadas al stock) y descarta el carrito invitado.
  async mergeGuestIntoUser(
    userId: string,
    guestToken: string,
  ): Promise<CartDto> {
    const guestCart = await this.prisma.cart.findUnique({
      where: { guestToken },
      include: { items: { include: { variant: true } } },
    });
    if (!guestCart || guestCart.items.length === 0) {
      if (guestCart) {
        await this.prisma.cart.delete({ where: { id: guestCart.id } });
      }
      return this.getCart({ userId });
    }

    const userCart = await this.prisma.cart.upsert({
      where: { userId },
      update: {},
      create: { userId },
    });

    for (const item of guestCart.items) {
      const existing = await this.prisma.cartItem.findUnique({
        where: {
          cartId_variantId: { cartId: userCart.id, variantId: item.variantId },
        },
      });
      const merged = Math.min(
        (existing?.quantity ?? 0) + item.quantity,
        item.variant.stock,
      );
      if (merged <= 0) continue;
      await this.prisma.cartItem.upsert({
        where: {
          cartId_variantId: { cartId: userCart.id, variantId: item.variantId },
        },
        update: { quantity: merged },
        create: {
          cartId: userCart.id,
          variantId: item.variantId,
          quantity: merged,
        },
      });
    }

    await this.prisma.cart.delete({ where: { id: guestCart.id } });
    return this.getCart({ userId });
  }

  private async findOwnItem(owner: CartOwner, itemId: string) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: { select: { userId: true, guestToken: true } },
        variant: true,
      },
    });
    const matches =
      'userId' in owner
        ? item?.cart.userId === owner.userId
        : item?.cart.guestToken === owner.guestToken;
    if (!item || !matches) {
      throw new NotFoundException({
        code: 'CART_ITEM_NOT_FOUND',
        message: 'El item no está en tu carrito',
      });
    }
    return item;
  }

  private assertStock(stock: number, requested: number): void {
    if (requested > stock) {
      throw new BadRequestException({
        code: 'INSUFFICIENT_STOCK',
        message: `Solo quedan ${stock} unidades disponibles`,
      });
    }
  }
}
