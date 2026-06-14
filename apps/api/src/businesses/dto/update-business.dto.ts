import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateBusinessDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @IsOptional()
  @IsUrl()
  bannerUrl?: string;

  // ── Contacto ──
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  whatsapp?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  instagram?: string;

  // ── Ubicación ──
  @IsOptional()
  @IsString()
  @MaxLength(160)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  province?: string;

  // ── Operación ──
  @IsOptional()
  @IsString()
  @MaxLength(300)
  hours?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  policies?: string;

  // ── Envíos ──
  @IsOptional()
  @IsBoolean()
  pickupEnabled?: boolean;

  // null = no ofrece envío a domicilio
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100_000_000)
  shippingCents?: number | null;
}
