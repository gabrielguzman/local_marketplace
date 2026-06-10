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
