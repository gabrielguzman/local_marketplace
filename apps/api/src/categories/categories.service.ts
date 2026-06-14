import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CategoryDetailDto, CategoryDto } from '@marketplace/shared';
import { slugify } from '../common/slug';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

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

  async findBySlug(slug: string): Promise<CategoryDetailDto> {
    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        parent: { select: { name: true, slug: true } },
        children: { orderBy: { name: 'asc' } },
      },
    });
    if (!category) {
      throw new NotFoundException({
        code: 'CATEGORY_NOT_FOUND',
        message: 'Categoría no encontrada',
      });
    }
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      parent: category.parent
        ? { name: category.parent.name, slug: category.parent.slug }
        : null,
      children: category.children.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
      })),
    };
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

  // ── ABM (admin) ──────────────────────────────────────────

  async create(dto: CreateCategoryDto): Promise<CategoryDto> {
    let parentSlug = '';
    if (dto.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: dto.parentId },
        select: { slug: true, parentId: true },
      });
      if (!parent) {
        throw new NotFoundException({
          code: 'PARENT_NOT_FOUND',
          message: 'La categoría padre no existe',
        });
      }
      // árbol de 2 niveles: el padre no puede ser a su vez una hija
      if (parent.parentId) {
        throw new ConflictException({
          code: 'NESTING_TOO_DEEP',
          message: 'Solo se permiten dos niveles de categorías',
        });
      }
      parentSlug = `${parent.slug}-`;
    }

    const slug = await this.uniqueSlug(`${parentSlug}${slugify(dto.name)}`);
    const created = await this.prisma.category.create({
      data: { name: dto.name, slug, parentId: dto.parentId ?? null },
    });
    return {
      id: created.id,
      name: created.name,
      slug: created.slug,
      children: [],
    };
  }

  async rename(id: string, dto: UpdateCategoryDto): Promise<CategoryDto> {
    await this.ensureExists(id);
    const updated = await this.prisma.category.update({
      where: { id },
      data: { name: dto.name },
    });
    return {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      children: [],
    };
  }

  async remove(id: string): Promise<void> {
    const category = await this.prisma.category.findUnique({
      where: { id },
      select: { _count: { select: { children: true, products: true } } },
    });
    if (!category) {
      throw new NotFoundException({
        code: 'CATEGORY_NOT_FOUND',
        message: 'Categoría no encontrada',
      });
    }
    if (category._count.children > 0) {
      throw new ConflictException({
        code: 'CATEGORY_HAS_CHILDREN',
        message: 'Borrá primero las subcategorías',
      });
    }
    if (category._count.products > 0) {
      throw new ConflictException({
        code: 'CATEGORY_HAS_PRODUCTS',
        message: 'No se puede borrar una categoría con productos',
      });
    }
    await this.prisma.category.delete({ where: { id } });
  }

  private async uniqueSlug(base: string): Promise<string> {
    let candidate = base;
    for (let i = 2; ; i++) {
      const taken = await this.prisma.category.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });
      if (!taken) return candidate;
      candidate = `${base}-${i}`;
    }
  }
}
