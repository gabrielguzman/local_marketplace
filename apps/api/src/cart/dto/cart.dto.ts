import { IsInt, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

export class AddCartItemDto {
  @IsUUID()
  variantId!: string;

  @IsInt()
  @Min(1)
  @Max(999)
  quantity!: number;
}

export class UpdateCartItemDto {
  @IsInt()
  @Min(1)
  @Max(999)
  quantity!: number;
}

export class MergeCartDto {
  @IsString()
  @MaxLength(64)
  guestToken!: string;
}
