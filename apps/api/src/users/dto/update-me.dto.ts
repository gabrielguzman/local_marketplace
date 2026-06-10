import {
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @Matches(/^\+?[0-9\s-]{6,20}$/, { message: 'Teléfono inválido' })
  phone?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}
