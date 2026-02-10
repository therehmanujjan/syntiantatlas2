import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, ExecutionContext, CanActivate } from '@nestjs/common';
import request from 'supertest';
import { Decimal } from '@prisma/client/runtime/library';
import { TransactionsController } from '../src/modules/transactions/transactions.controller';
import { TransactionsService } from '../src/modules/transactions/transactions.service';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { AuditService } from '../src/modules/audit/audit.service';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { AuthGuard } from '@nestjs/passport';

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

describe('Transactions Flow (e2e)', () => {
  let app: INestApplication;
  let prisma: any;

  const mockTransaction = {
    id: 1,
    userId: 5,
    type: 'deposit',
    amount: new Decimal(10000),
    status: 'completed',
    paymentMethod: 'bank_transfer',
    gateway: null,
    referenceNumber: 'DEP-ABC123DEF456',
    description: 'Deposit of 10000',
    createdAt: new Date(),
  };

  beforeAll(async () => {
    const txMock = {
      transaction: { create: jest.fn().mockResolvedValue(mockTransaction) },
      user: { update: jest.fn().mockResolvedValue({ id: 5, walletBalance: new Decimal(60000) }) },
    };

    prisma = {
      $transaction: jest.fn(async (cb: any) => cb(txMock)),
      user: { findUnique: jest.fn() },
      transaction: { findMany: jest.fn(), count: jest.fn() },
      _tx: txMock,
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [
        TransactionsService,
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

  beforeEach(() => {
    // Reset the $transaction mock since clearAllMocks would remove its implementation
    prisma.$transaction = jest.fn(async (cb: any) => cb(prisma._tx));
    // Reset inner tx mocks
    prisma._tx.transaction.create.mockResolvedValue(mockTransaction);
    prisma._tx.user.update.mockResolvedValue({ id: 5, walletBalance: new Decimal(60000) });
  });

  // ── Deposit ──

  describe('POST /api/transactions/deposit', () => {
    it('should deposit funds for authenticated user', async () => {
      mockCurrentUser = { id: 5, email: 'user@test.com', roleId: 'investor' };

      const res = await request(app.getHttpServer())
        .post('/api/transactions/deposit')
        .send({ amount: 10000, paymentMethod: 'bank_transfer' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.type).toBe('deposit');
    });

    it('should return 403 without authentication', async () => {
      mockCurrentUser = null;

      await request(app.getHttpServer())
        .post('/api/transactions/deposit')
        .send({ amount: 10000 })
        .expect(403);
    });

    it('should return 400 for invalid amount', async () => {
      mockCurrentUser = { id: 5, email: 'user@test.com', roleId: 'investor' };

      await request(app.getHttpServer())
        .post('/api/transactions/deposit')
        .send({ amount: 0 })
        .expect(400);
    });
  });

  // ── Withdraw ──

  describe('POST /api/transactions/withdraw', () => {
    it('should withdraw funds for user with sufficient balance', async () => {
      mockCurrentUser = { id: 5, email: 'user@test.com', roleId: 'investor' };
      prisma.user.findUnique.mockResolvedValue({ walletBalance: new Decimal(50000) });

      const withdrawTx = { ...mockTransaction, type: 'withdrawal', status: 'pending' };
      prisma._tx.transaction.create.mockResolvedValue(withdrawTx);

      const res = await request(app.getHttpServer())
        .post('/api/transactions/withdraw')
        .send({ amount: 5000, paymentMethod: 'bank_transfer' })
        .expect(201);

      expect(res.body.data.type).toBe('withdrawal');
      expect(res.body.data.status).toBe('pending');
    });

    it('should return 400 for insufficient balance', async () => {
      mockCurrentUser = { id: 5, email: 'user@test.com', roleId: 'investor' };
      prisma.user.findUnique.mockResolvedValue({ walletBalance: new Decimal(100) });

      await request(app.getHttpServer())
        .post('/api/transactions/withdraw')
        .send({ amount: 5000 })
        .expect(400);
    });
  });

  // ── History ──

  describe('GET /api/transactions/history', () => {
    it('should return paginated transaction history with summary', async () => {
      mockCurrentUser = { id: 5, email: 'user@test.com', roleId: 'investor' };
      prisma.transaction.findMany
        .mockResolvedValueOnce([mockTransaction])
        .mockResolvedValueOnce([
          { type: 'deposit', amount: new Decimal(10000) },
        ]);
      prisma.transaction.count.mockResolvedValue(1);

      const res = await request(app.getHttpServer())
        .get('/api/transactions/history')
        .expect(200);

      expect(res.body.data.data).toHaveLength(1);
      expect(res.body.data.pagination).toBeDefined();
      expect(res.body.data.summary).toBeDefined();
    });

    it('should filter by type', async () => {
      mockCurrentUser = { id: 5, email: 'user@test.com', roleId: 'investor' };
      prisma.transaction.findMany.mockResolvedValue([]);
      prisma.transaction.count.mockResolvedValue(0);

      await request(app.getHttpServer())
        .get('/api/transactions/history?type=deposit')
        .expect(200);
    });
  });
});
