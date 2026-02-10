import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ContentService } from '../content.service';
import { PrismaService } from '../../../common/prisma/prisma.service';

describe('ContentService', () => {
  let service: ContentService;
  let prisma: any;

  const mockContentItem = {
    id: 1,
    title: 'Getting Started with Real Estate',
    excerpt: 'Learn the basics',
    body: '<p>Full article content</p>',
    type: 'article',
    category: 'getting_started',
    difficulty: 'beginner',
    readTime: 5,
    thumbnailUrl: 'https://example.com/thumb.jpg',
    videoUrl: null,
    tags: ['real-estate', 'beginner'],
    isPublished: true,
    publishedAt: new Date(),
    createdAt: new Date(),
  };

  const mockProgress = {
    id: 1,
    userId: 5,
    contentItemId: 1,
    completed: false,
    completedAt: null,
    lastAccessedAt: new Date(),
    contentItem: {
      id: 1,
      title: 'Getting Started',
      category: 'getting_started',
      type: 'article',
    },
  };

  beforeEach(async () => {
    prisma = {
      contentItem: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
      },
      contentProgress: {
        findMany: jest.fn(),
        upsert: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<ContentService>(ContentService);
  });

  // ── findAll ──

  describe('findAll', () => {
    it('should return paginated published content', async () => {
      prisma.contentItem.findMany.mockResolvedValue([mockContentItem]);
      prisma.contentItem.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 12 });

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(prisma.contentItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ isPublished: true }),
        }),
      );
    });

    it('should filter by category', async () => {
      prisma.contentItem.findMany.mockResolvedValue([]);
      prisma.contentItem.count.mockResolvedValue(0);

      await service.findAll({ category: 'investment_basics' });

      expect(prisma.contentItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category: 'investment_basics' }),
        }),
      );
    });

    it('should search across title, body, excerpt', async () => {
      prisma.contentItem.findMany.mockResolvedValue([]);
      prisma.contentItem.count.mockResolvedValue(0);

      await service.findAll({ search: 'real estate' });

      expect(prisma.contentItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { title: { contains: 'real estate', mode: 'insensitive' } },
            ]),
          }),
        }),
      );
    });
  });

  // ── findOne ──

  describe('findOne', () => {
    it('should return content item and track progress for authenticated user', async () => {
      prisma.contentItem.findFirst.mockResolvedValue(mockContentItem);
      prisma.contentProgress.upsert.mockResolvedValue(mockProgress);

      const result = await service.findOne(1, 5);

      expect(result.title).toBe('Getting Started with Real Estate');
      expect(prisma.contentProgress.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_contentItemId: { userId: 5, contentItemId: 1 } },
        }),
      );
    });

    it('should return content without tracking for anonymous user', async () => {
      prisma.contentItem.findFirst.mockResolvedValue(mockContentItem);

      const result = await service.findOne(1);

      expect(result.title).toBe('Getting Started with Real Estate');
      expect(prisma.contentProgress.upsert).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent content', async () => {
      prisma.contentItem.findFirst.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ── getCategories ──

  describe('getCategories', () => {
    it('should return category counts', async () => {
      prisma.contentItem.groupBy.mockResolvedValue([
        { category: 'getting_started', _count: { id: 5 } },
        { category: 'investment_basics', _count: { id: 3 } },
      ]);

      const result = await service.getCategories();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ category: 'getting_started', count: 5 });
    });
  });

  // ── getProgress ──

  describe('getProgress', () => {
    it('should return progress summary with percentage', async () => {
      prisma.contentProgress.findMany.mockResolvedValue([
        { ...mockProgress, completed: true },
        { ...mockProgress, id: 2, contentItemId: 2, completed: false },
      ]);
      prisma.contentItem.count.mockResolvedValue(10);

      const result = await service.getProgress(5);

      expect(result.totalItems).toBe(10);
      expect(result.completedCount).toBe(1);
      expect(result.progressPercentage).toBe(10);
      expect(result.items).toHaveLength(2);
    });

    it('should return 0% when no published content exists', async () => {
      prisma.contentProgress.findMany.mockResolvedValue([]);
      prisma.contentItem.count.mockResolvedValue(0);

      const result = await service.getProgress(5);

      expect(result.progressPercentage).toBe(0);
    });
  });

  // ── markComplete ──

  describe('markComplete', () => {
    it('should mark content as complete', async () => {
      prisma.contentItem.findFirst.mockResolvedValue(mockContentItem);
      prisma.contentProgress.upsert.mockResolvedValue({
        ...mockProgress,
        completed: true,
        completedAt: new Date(),
      });

      const result = await service.markComplete(5, 1);

      expect(result.completed).toBe(true);
      expect(prisma.contentProgress.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({ completed: true }),
          create: expect.objectContaining({ completed: true }),
        }),
      );
    });

    it('should throw NotFoundException for non-existent content', async () => {
      prisma.contentItem.findFirst.mockResolvedValue(null);

      await expect(service.markComplete(5, 999)).rejects.toThrow(NotFoundException);
    });
  });

  // ── Admin CRUD ──

  describe('create (admin)', () => {
    it('should create content with publishedAt when isPublished is true', async () => {
      const dto = {
        title: 'New Article',
        body: 'Content body',
        type: 'article',
        category: 'getting_started',
        isPublished: true,
      };
      prisma.contentItem.create.mockResolvedValue({ ...mockContentItem, ...dto });

      await service.create(dto as any);

      expect(prisma.contentItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isPublished: true,
            publishedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should create unpublished content with null publishedAt', async () => {
      const dto = {
        title: 'Draft',
        body: 'Content body',
        type: 'article',
        category: 'getting_started',
        isPublished: false,
      };
      prisma.contentItem.create.mockResolvedValue({ ...mockContentItem, ...dto });

      await service.create(dto as any);

      expect(prisma.contentItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ publishedAt: null }),
        }),
      );
    });
  });

  describe('update (admin)', () => {
    it('should set publishedAt when first published', async () => {
      prisma.contentItem.findUnique.mockResolvedValue({
        ...mockContentItem,
        isPublished: false,
        publishedAt: null,
      });
      prisma.contentItem.update.mockResolvedValue(mockContentItem);

      await service.update(1, { isPublished: true } as any);

      expect(prisma.contentItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ publishedAt: expect.any(Date) }),
        }),
      );
    });

    it('should throw NotFoundException for non-existent content', async () => {
      prisma.contentItem.findUnique.mockResolvedValue(null);

      await expect(service.update(999, {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove (admin)', () => {
    it('should delete content and associated progress', async () => {
      prisma.contentItem.findUnique.mockResolvedValue(mockContentItem);
      prisma.contentProgress.deleteMany.mockResolvedValue({ count: 2 });
      prisma.contentItem.delete.mockResolvedValue(mockContentItem);

      await service.remove(1);

      expect(prisma.contentProgress.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { contentItemId: 1 } }),
      );
      expect(prisma.contentItem.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should throw NotFoundException for non-existent content', async () => {
      prisma.contentItem.findUnique.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
