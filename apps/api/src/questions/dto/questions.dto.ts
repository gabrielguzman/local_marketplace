import { IsString, MaxLength, MinLength } from 'class-validator';

export class AskQuestionDto {
  @IsString()
  @MinLength(5)
  @MaxLength(500)
  body!: string;
}

export class AnswerQuestionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  answer!: string;
}
