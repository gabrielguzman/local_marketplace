import { IsIn, IsString, MaxLength, MinLength } from 'class-validator';

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
}

export class UpdateSubOrderStatusDto {
  @IsIn(['CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
  status!: 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
}
