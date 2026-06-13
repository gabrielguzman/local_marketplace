import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAddressDto {
  @IsString()
  @MaxLength(120)
  street!: string;

  @IsString()
  @MaxLength(10)
  number!: string;

  @IsString()
  @MaxLength(80)
  city!: string;

  @IsString()
  @MaxLength(80)
  province!: string;

  @IsString()
  @MaxLength(12)
  zipCode!: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  street?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  number?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  province?: string;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  zipCode?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
