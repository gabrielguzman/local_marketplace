import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { QuestionDto } from '@marketplace/shared';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AnswerQuestionDto, AskQuestionDto } from './dto/questions.dto';

const QUESTION_INCLUDE = {
  author: { select: { name: true } },
} satisfies Prisma.QuestionInclude;

type QuestionWithAuthor = Prisma.QuestionGetPayload<{
  include: typeof QUESTION_INCLUDE;
}>;

function toDto(q: QuestionWithAuthor): QuestionDto {
  return {
    id: q.id,
    body: q.body,
    answer: q.answer,
    answeredAt: q.answeredAt?.toISOString() ?? null,
    authorName: q.author.name,
    authorId: q.authorId,
    createdAt: q.createdAt.toISOString(),
  };
}

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(productId: string): Promise<QuestionDto[]> {
    const questions = await this.prisma.question.findMany({
      where: { productId },
      include: QUESTION_INCLUDE,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return questions.map(toDto);
  }

  async ask(
    userId: string,
    productId: string,
    dto: AskQuestionDto,
  ): Promise<QuestionDto> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { status: true },
    });
    if (!product || product.status !== 'ACTIVE') {
      throw new NotFoundException({
        code: 'PRODUCT_NOT_FOUND',
        message: 'Producto no encontrado',
      });
    }
    const question = await this.prisma.question.create({
      data: { productId, authorId: userId, body: dto.body },
      include: QUESTION_INCLUDE,
    });
    return toDto(question);
  }

  async answer(
    userId: string,
    productId: string,
    questionId: string,
    dto: AnswerQuestionDto,
  ): Promise<QuestionDto> {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: { product: { select: { businessId: true } } },
    });
    if (!question || question.productId !== productId) {
      throw new NotFoundException({
        code: 'QUESTION_NOT_FOUND',
        message: 'Pregunta no encontrada',
      });
    }
    const business = await this.prisma.business.findUnique({
      where: { id: question.product.businessId },
      select: { ownerId: true },
    });
    if (business?.ownerId !== userId) {
      throw new ForbiddenException({
        code: 'NOT_BUSINESS_OWNER',
        message: 'Solo el vendedor puede responder',
      });
    }
    const updated = await this.prisma.question.update({
      where: { id: questionId },
      data: { answer: dto.answer, answeredAt: new Date() },
      include: QUESTION_INCLUDE,
    });
    return toDto(updated);
  }
}
