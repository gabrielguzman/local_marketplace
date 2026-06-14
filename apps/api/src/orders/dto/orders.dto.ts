import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { SHIPPING_METHODS, type ShippingMethod } from '@marketplace/shared';

export class ShippingChoiceDto {
  @IsUUID()
  businessId!: string;

  @IsIn(SHIPPING_METHODS)
  method!: ShippingMethod;
}

export class CheckoutDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  street!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(10)
  number!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  city!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(80)
  province!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(12)
  zipCode!: string;

  // Método de envío elegido por cada negocio del carrito
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShippingChoiceDto)
  shipping?: ShippingChoiceDto[];
}

export class UpdateSubOrderStatusDto {
  @IsIn(['CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
  status!: 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

  // al marcar enviada
  @IsOptional()
  @IsString()
  @MaxLength(80)
  trackingCode?: string;

  // al cancelar
  @IsOptional()
  @IsString()
  @MaxLength(300)
  cancelReason?: string;
}
