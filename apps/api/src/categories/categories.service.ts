import { Injectable, NotFoundException } from '@nestjs/common';
import type { CategoryDto } from '@marketplace/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async tree(): Promise<CategoryDto[]> {
    const roots = await this.prisma.category.findMany({
      where: { parentId: null },
      include: { children: { orderBy: { name: 'asc' } } },
      orderBy: { name: 'asc' },
    });
    return roots.map((root) => ({
      id: root.id,
      name: root.name,
      slug: root.slug,
      children: root.children.map((child) => ({
        id: child.id,
        name: child.name,
        slug: child.slug,
        children: [],
      })),
    }));
  }

  async ensureExists(id: string): Promise<void> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!category) {
      throw new NotFoundException({
        code: 'CATEGORY_NOT_FOUND',
        message: 'Categoría inexistente',
      });
    }
  }
}
