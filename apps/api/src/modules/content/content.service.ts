import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateContentDto, UpdateContentDto, QueryContentDto } from './dto/content.dto';

@Injectable()
export class ContentService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryContentDto) {
    const { page = 1, limit = 12, search, category, type, difficulty } = query;
    const skip = (page - 1) * limit;

    const where: any = { isPublished: true };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) where.category = category;
    if (type) where.type = type;
    if (difficulty) where.difficulty = difficulty;

    const [items, total] = await Promise.all([
      this.prisma.contentItem.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          excerpt: true,
          type: true,
          category: true,
          difficulty: true,
          readTime: true,
          thumbnailUrl: true,
          tags: true,
          publishedAt: true,
          createdAt: true,
        },
      }),
      this.prisma.contentItem.count({ where }),
    ]);

    return {
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number, userId?: number) {
    const item = await this.prisma.contentItem.findFirst({
      where: { id, isPublished: true },
    });

    if (!item) throw new NotFoundException('Content not found');

    // Track progress if user is authenticated
    if (userId) {
      await this.prisma.contentProgress.upsert({
        where: {
          userId_contentItemId: { userId, contentItemId: id },
        },
        update: { lastAccessedAt: new Date() },
        create: { userId, contentItemId: id },
      });
    }

    return item;
  }

  async getCategories() {
    const counts = await this.prisma.contentItem.groupBy({
      by: ['category'],
      where: { isPublished: true },
      _count: { id: true },
    });

    return counts.map((c) => ({
      category: c.category,
      count: c._count.id,
    }));
  }

  async getProgress(userId: number) {
    const progress = await this.prisma.contentProgress.findMany({
      where: { userId },
      include: {
        contentItem: {
          select: { id: true, title: true, category: true, type: true },
        },
      },
      orderBy: { lastAccessedAt: 'desc' },
    });

    const totalItems = await this.prisma.contentItem.count({ where: { isPublished: true } });
    const completedCount = progress.filter((p) => p.completed).length;

    return {
      totalItems,
      completedCount,
      progressPercentage: totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0,
      items: progress,
    };
  }

  async markComplete(userId: number, contentItemId: number) {
    const item = await this.prisma.contentItem.findFirst({
      where: { id: contentItemId, isPublished: true },
    });
    if (!item) throw new NotFoundException('Content not found');

    return this.prisma.contentProgress.upsert({
      where: {
        userId_contentItemId: { userId, contentItemId },
      },
      update: { completed: true, completedAt: new Date(), lastAccessedAt: new Date() },
      create: { userId, contentItemId, completed: true, completedAt: new Date() },
    });
  }

  // ── Admin CRUD ──

  async adminFindAll(query: QueryContentDto) {
    const { page = 1, limit = 12, search, category, type } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category) where.category = category;
    if (type) where.type = type;

    const [items, total] = await Promise.all([
      this.prisma.contentItem.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.contentItem.count({ where }),
    ]);

    return {
      data: items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async create(dto: CreateContentDto) {
    return this.prisma.contentItem.create({
      data: {
        ...dto,
        tags: dto.tags ?? [],
        publishedAt: dto.isPublished ? new Date() : null,
      },
    });
  }

  async update(id: number, dto: UpdateContentDto) {
    const existing = await this.prisma.contentItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Content not found');

    const data: any = { ...dto };
    if (dto.tags !== undefined) data.tags = dto.tags;

    // Set publishedAt when first published
    if (dto.isPublished && !existing.isPublished) {
      data.publishedAt = new Date();
    }

    return this.prisma.contentItem.update({ where: { id }, data });
  }

  async remove(id: number) {
    const existing = await this.prisma.contentItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Content not found');

    await this.prisma.contentProgress.deleteMany({ where: { contentItemId: id } });
    return this.prisma.contentItem.delete({ where: { id } });
  }
}
