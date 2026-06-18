import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreateVariantDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  sku?: string;

  // {"color": "rojo", "talle": "M"}
  @IsOptional()
  @IsObject()
  attributes?: Record<string, string>;

  @IsInt()
  @Min(1)
  @Max(1_000_000_000)
  priceCents!: number;

  @IsInt()
  @Min(0)
  @Max(1_000_000)
  stock!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;
}

export class SpecDto {
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  key!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  value!: string;
}

export class CreateProductDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  brand?: string;

  @IsOptional()
  @IsIn(['NEW', 'USED'])
  condition?: 'NEW' | 'USED';

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => SpecDto)
  specs?: SpecDto[];

  @IsUUID()
  categoryId!: string;

  @IsOptional()
  @IsIn(['DRAFT', 'ACTIVE'])
  status?: 'DRAFT' | 'ACTIVE';

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(8)
  @IsUrl({}, { each: true })
  images?: string[];

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants!: CreateVariantDto[];
}
