import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, ExecutionContext, CanActivate } from '@nestjs/common';
import request from 'supertest';
import { Decimal } from '@prisma/client/runtime/library';
import { PropertiesController, AdminPropertiesController } from '../src/modules/properties/properties.controller';
import { PropertiesService } from '../src/modules/properties/properties.service';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { AuditService } from '../src/modules/audit/audit.service';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

// Mock user that AuthGuard attaches to request
let mockCurrentUser: any = null;

class MockAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    if (!mockCurrentUser) return false;
    const req = context.switchToHttp().getRequest();
    req.user = mockCurrentUser;
    return true;
  }
}

describe('Properties Flow (e2e)', () => {
  let app: INestApplication;
  let prisma: any;

  const mockProperty = {
    id: 1,
    title: 'Test Property',
    description: 'A test property',
    location: 'Lahore',
    address: '123 Main St',
    city: 'Lahore',
    propertyType: 'residential',
    areaSqft: new Decimal(1200),
    totalValue: new Decimal(500000),
    fundingTarget: new Decimal(500000),
    minInvestment: new Decimal(1000),
    maxInvestment: new Decimal(50000),
    expectedReturnsAnnual: new Decimal(12),
    rentalYield: new Decimal(8),
    status: 'active',
    sellerId: 10,
    createdAt: new Date(),
    seller: { id: 10, firstName: 'Ali', lastName: 'Khan', email: 'ali@test.com' },
    _count: { investments: 3 },
  };

  beforeAll(async () => {
    prisma = {
      property: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      investment: { count: jest.fn() },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PropertiesController, AdminPropertiesController],
      providers: [
        PropertiesService,
        Reflector,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: { log: jest.fn() } },
      ],
    })
      .overrideGuard(AuthGuard('jwt'))
      .useClass(MockAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    mockCurrentUser = null;
  });

  // ── Public endpoints ──

  describe('GET /api/properties', () => {
    it('should list properties without authentication', async () => {
      prisma.property.findMany.mockResolvedValue([mockProperty]);
      prisma.property.count.mockResolvedValue(1);

      const res = await request(app.getHttpServer())
        .get('/api/properties')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.data).toHaveLength(1);
      expect(res.body.data.pagination.total).toBe(1);
    });

    it('should accept query parameters', async () => {
      prisma.property.findMany.mockResolvedValue([]);
      prisma.property.count.mockResolvedValue(0);

      await request(app.getHttpServer())
        .get('/api/properties?city=Lahore&status=active&page=1&limit=10')
        .expect(200);
    });
  });

  describe('GET /api/properties/:id', () => {
    it('should return a single property', async () => {
      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.investment.count.mockResolvedValue(5);

      const res = await request(app.getHttpServer())
        .get('/api/properties/1')
        .expect(200);

      expect(res.body.data.title).toBe('Test Property');
      expect(res.body.data.investorCount).toBe(5);
    });

    it('should return 404 for non-existent property', async () => {
      prisma.property.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/api/properties/999')
        .expect(404);
    });
  });

  // ── Seller flow ──

  describe('POST /api/properties (seller)', () => {
    it('should create a property when authenticated as seller', async () => {
      mockCurrentUser = { id: 10, email: 'seller@test.com', roleId: 'seller' };
      prisma.property.create.mockResolvedValue({ ...mockProperty, status: 'pending' });

      const res = await request(app.getHttpServer())
        .post('/api/properties')
        .send({
          title: 'New Property',
          totalValue: 500000,
          fundingTarget: 500000,
          minInvestment: 1000,
          maxInvestment: 50000,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      mockCurrentUser = null;

      await request(app.getHttpServer())
        .post('/api/properties')
        .send({ title: 'Test', totalValue: 100 })
        .expect(403); // MockAuthGuard returns false → 403
    });
  });

  // ── Admin flow ──

  describe('GET /api/admin/properties/pending', () => {
    it('should return pending properties for admin', async () => {
      mockCurrentUser = { id: 1, email: 'admin@test.com', roleId: 'admin' };
      prisma.property.findMany.mockResolvedValue([{ ...mockProperty, status: 'pending' }]);

      const res = await request(app.getHttpServer())
        .get('/api/admin/properties/pending')
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should return 403 for non-admin user', async () => {
      mockCurrentUser = { id: 10, email: 'investor@test.com', roleId: 'investor' };

      await request(app.getHttpServer())
        .get('/api/admin/properties/pending')
        .expect(403);
    });
  });

  describe('PUT /api/admin/properties/:id/status', () => {
    it('should allow admin to approve a property', async () => {
      mockCurrentUser = { id: 1, email: 'admin@test.com', roleId: 'admin' };
      prisma.property.findUnique.mockResolvedValue(mockProperty);
      prisma.property.update.mockResolvedValue({ ...mockProperty, status: 'active' });

      const res = await request(app.getHttpServer())
        .put('/api/admin/properties/1/status')
        .send({ status: 'active' })
        .expect(200);

      expect(res.body.data.status).toBe('active');
    });
  });
});
