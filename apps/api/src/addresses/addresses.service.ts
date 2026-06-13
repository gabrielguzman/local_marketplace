import { Injectable, NotFoundException } from '@nestjs/common';
import type { Address } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string): Promise<Address[]> {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { id: 'asc' }],
    });
  }

  async create(userId: string, dto: CreateAddressDto): Promise<Address> {
    const count = await this.prisma.address.count({ where: { userId } });
    // la primera dirección siempre nace como default
    const makeDefault = dto.isDefault || count === 0;

    return this.prisma.$transaction(async (tx) => {
      if (makeDefault) {
        await tx.address.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }
      return tx.address.create({
        data: {
          userId,
          street: dto.street,
          number: dto.number,
          city: dto.city,
          province: dto.province,
          zipCode: dto.zipCode,
          isDefault: makeDefault,
        },
      });
    });
  }

  async update(
    userId: string,
    addressId: string,
    dto: UpdateAddressDto,
  ): Promise<Address> {
    await this.findOwn(userId, addressId);
    const { isDefault, ...fields } = dto;

    return this.prisma.$transaction(async (tx) => {
      if (isDefault === true) {
        await tx.address.updateMany({
          where: { userId },
          data: { isDefault: false },
        });
      }
      return tx.address.update({
        where: { id: addressId },
        data: { ...fields, ...(isDefault !== undefined && { isDefault }) },
      });
    });
  }

  async remove(userId: string, addressId: string): Promise<void> {
    const address = await this.findOwn(userId, addressId);
    await this.prisma.address.delete({ where: { id: addressId } });

    // si era la default, promovemos otra para que siempre haya una
    if (address.isDefault) {
      const next = await this.prisma.address.findFirst({
        where: { userId },
        orderBy: { id: 'asc' },
      });
      if (next) {
        await this.prisma.address.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }
  }

  private async findOwn(userId: string, addressId: string): Promise<Address> {
    const address = await this.prisma.address.findUnique({
      where: { id: addressId },
    });
    if (!address || address.userId !== userId) {
      throw new NotFoundException({
        code: 'ADDRESS_NOT_FOUND',
        message: 'La dirección no existe',
      });
    }
    return address;
  }
}
