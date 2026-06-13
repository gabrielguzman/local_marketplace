import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { ChangePasswordDto, DeleteAccountDto } from './dto/account.dto';
import { UpdateMeDto } from './dto/update-me.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'Usuario no encontrado',
      });
    }
    return user;
  }

  update(id: string, dto: UpdateMeDto): Promise<User> {
    return this.prisma.user.update({ where: { id }, data: dto });
  }

  // Cambia la contraseña verificando la actual. Cierra las demás sesiones.
  async changePassword(id: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.findById(id);
    const valid =
      user.passwordHash != null &&
      (await argon2.verify(user.passwordHash, dto.currentPassword));
    if (!valid) {
      throw new UnauthorizedException({
        code: 'INVALID_PASSWORD',
        message: 'La contraseña actual es incorrecta',
      });
    }
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id },
        data: { passwordHash: await argon2.hash(dto.newPassword) },
      }),
      this.prisma.refreshToken.deleteMany({ where: { userId: id } }),
    ]);
  }

  // Baja de cuenta (Ley 25.326): anonimiza los datos personales y deja la
  // cuenta inutilizable, conservando el historial de órdenes/reseñas.
  async deleteAccount(id: string, dto: DeleteAccountDto): Promise<void> {
    const user = await this.findById(id);
    const valid =
      user.passwordHash != null &&
      (await argon2.verify(user.passwordHash, dto.password));
    if (!valid) {
      throw new UnauthorizedException({
        code: 'INVALID_PASSWORD',
        message: 'La contraseña es incorrecta',
      });
    }
    if (user.role === 'ADMIN') {
      throw new BadRequestException({
        code: 'ADMIN_CANNOT_DELETE',
        message: 'Una cuenta de administrador no puede darse de baja sola',
      });
    }

    await this.prisma.$transaction([
      // borrar datos personales y de sesión
      this.prisma.refreshToken.deleteMany({ where: { userId: id } }),
      this.prisma.verificationToken.deleteMany({ where: { userId: id } }),
      this.prisma.address.deleteMany({ where: { userId: id } }),
      this.prisma.favorite.deleteMany({ where: { userId: id } }),
      this.prisma.cart.deleteMany({ where: { userId: id } }),
      // si tenía tienda, queda suspendida (sale del público)
      this.prisma.business.updateMany({
        where: { ownerId: id },
        data: { status: 'SUSPENDED' },
      }),
      // anonimizar la cuenta
      this.prisma.user.update({
        where: { id },
        data: {
          email: `deleted-${id}@deleted.local`,
          name: 'Usuario eliminado',
          passwordHash: null,
          phone: null,
          avatarUrl: null,
          status: 'SUSPENDED',
          emailVerifiedAt: null,
        },
      }),
    ]);
  }
}
