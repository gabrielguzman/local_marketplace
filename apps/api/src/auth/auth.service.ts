import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'node:crypto';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import type { AccessTokenPayload } from './auth.types';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

export const REFRESH_TTL_DAYS = 30;
const EMAIL_VERIFY_TTL_HOURS = 48;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly email: EmailService,
  ) {}

  async register(dto: RegisterDto): Promise<{ user: User } & TokenPair> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException({
        code: 'EMAIL_TAKEN',
        message: 'Ya existe una cuenta con ese email',
      });
    }

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash: await argon2.hash(dto.password),
      },
    });
    await this.sendVerificationEmail(user);
    return { user, ...(await this.issueTokens(user)) };
  }

  // ── Verificación de email ──────────────────────────────

  async resendVerification(userId: string): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    if (user.emailVerifiedAt) {
      throw new BadRequestException({
        code: 'ALREADY_VERIFIED',
        message: 'Tu email ya está verificado',
      });
    }
    await this.sendVerificationEmail(user);
  }

  async verifyEmail(token: string): Promise<void> {
    const stored = await this.prisma.verificationToken.findUnique({
      where: { tokenHash: this.hashToken(token) },
    });
    if (
      !stored ||
      stored.type !== 'EMAIL_VERIFY' ||
      stored.expiresAt < new Date()
    ) {
      throw new BadRequestException({
        code: 'INVALID_VERIFICATION_TOKEN',
        message: 'El enlace de verificación es inválido o venció',
      });
    }
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: stored.userId },
        data: { emailVerifiedAt: new Date() },
      }),
      this.prisma.verificationToken.deleteMany({
        where: { userId: stored.userId, type: 'EMAIL_VERIFY' },
      }),
    ]);
  }

  private async sendVerificationEmail(user: User): Promise<void> {
    const token = randomBytes(32).toString('base64url');
    await this.prisma.verificationToken.create({
      data: {
        userId: user.id,
        type: 'EMAIL_VERIFY',
        tokenHash: this.hashToken(token),
        expiresAt: new Date(
          Date.now() + EMAIL_VERIFY_TTL_HOURS * 60 * 60 * 1000,
        ),
      },
    });
    await this.email.sendEmailVerification(user.email, token);
  }

  async login(dto: LoginDto): Promise<{ user: User } & TokenPair> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    const valid =
      user?.passwordHash != null &&
      (await argon2.verify(user.passwordHash, dto.password));
    if (!user || !valid) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Email o contraseña incorrectos',
      });
    }
    return { user, ...(await this.issueTokens(user)) };
  }

  // Rotación: el refresh token es de un solo uso; al canjearlo se borra
  // y se emite uno nuevo.
  async refresh(refreshToken: string): Promise<{ user: User } & TokenPair> {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      if (stored) {
        await this.prisma.refreshToken.delete({ where: { id: stored.id } });
      }
      throw new UnauthorizedException({
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Sesión expirada, volvé a iniciar sesión',
      });
    }

    await this.prisma.refreshToken.delete({ where: { id: stored.id } });
    return { user: stored.user, ...(await this.issueTokens(stored.user)) };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { tokenHash: this.hashToken(refreshToken) },
    });
  }

  private async issueTokens(user: User): Promise<TokenPair> {
    const payload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const accessToken = await this.jwt.signAsync(payload);

    const refreshToken = randomBytes(48).toString('base64url');
    const expiresAt = new Date(
      Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
    );
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
