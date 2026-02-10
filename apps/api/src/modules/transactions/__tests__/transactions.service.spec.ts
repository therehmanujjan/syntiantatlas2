import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { TransactionsService } from '../transactions.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let prisma: any;
  let auditService: any;

  const mockUser = {
    id: 5,
    walletBalance: new Decimal(50000),
  };

  const mockTransaction = {
    id: 1,
    userId: 5,
    type: 'deposit',
    amount: new Decimal(10000),
    status: 'completed',
    paymentMethod: 'bank_transfer',
    referenceNumber: 'DEP-ABC123',
    description: 'Deposit of 10000',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const txMock = {
      transaction: {
        create: jest.fn().mockResolvedValue(mockTransaction),
      },
      user: {
        update: jest.fn().mockResolvedValue(mockUser),
      },
    };

    prisma = {
      $transaction: jest.fn(async (cb: any) => cb(txMock)),
      user: {
        findUnique: jest.fn(),
      },
      transaction: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      _tx: txMock,
    };

    auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
  });

  // ── deposit ──

  describe('deposit', () => {
    it('should create a deposit and increment wallet balance', async () => {
      const result = await service.deposit(
        { amount: 10000, paymentMethod: 'bank_transfer' },
        5,
        '127.0.0.1',
      );

      expect(result.id).toBe(1);
      expect(prisma._tx.transaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'deposit',
            status: 'completed',
          }),
        }),
      );
      expect(prisma._tx.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 5 },
          data: { walletBalance: { increment: expect.any(Decimal) } },
        }),
      );
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'deposit' }),
      );
    });

    it('should generate a reference number starting with DEP-', async () => {
      await service.deposit({ amount: 5000 }, 5);

      const callData = prisma._tx.transaction.create.mock.calls[0][0].data;
      expect(callData.referenceNumber).toMatch(/^DEP-[A-F0-9]{12}$/);
    });
  });

  // ── withdraw ──

  describe('withdraw', () => {
    it('should create a withdrawal with pending status', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const withdrawTx = { ...mockTransaction, type: 'withdrawal', status: 'pending' };
      prisma._tx.transaction.create.mockResolvedValue(withdrawTx);

      const result = await service.withdraw(
        { amount: 5000, paymentMethod: 'bank_transfer' },
        5,
        '127.0.0.1',
      );

      expect(result.type).toBe('withdrawal');
      expect(result.status).toBe('pending');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'withdrawal' }),
      );
    });

    it('should throw NotFoundException if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.withdraw({ amount: 5000 }, 999),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for insufficient balance', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        walletBalance: new Decimal(1000),
      });

      await expect(
        service.withdraw({ amount: 5000 }, 5),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── getHistory ──

  describe('getHistory', () => {
    it('should return paginated transaction history with summary', async () => {
      prisma.transaction.findMany
        .mockResolvedValueOnce([mockTransaction]) // paginated list
        .mockResolvedValueOnce([                  // summary query
          { type: 'deposit', amount: new Decimal(30000) },
          { type: 'withdrawal', amount: new Decimal(5000) },
          { type: 'investment', amount: new Decimal(10000) },
          { type: 'dividend', amount: new Decimal(2000) },
        ]);
      prisma.transaction.count.mockResolvedValue(1);

      const result = await service.getHistory(5, { page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.summary.totalDeposits.toNumber()).toBe(30000);
      expect(result.summary.totalWithdrawals.toNumber()).toBe(5000);
      expect(result.summary.totalInvestments.toNumber()).toBe(10000);
      expect(result.summary.totalDividends.toNumber()).toBe(2000);
    });

    it('should filter by type', async () => {
      prisma.transaction.findMany.mockResolvedValue([]);
      prisma.transaction.count.mockResolvedValue(0);

      await service.getHistory(5, { type: 'deposit' });

      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 5, type: 'deposit' }),
        }),
      );
    });

    it('should return zero summary for user with no transactions', async () => {
      prisma.transaction.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      prisma.transaction.count.mockResolvedValue(0);

      const result = await service.getHistory(5, {});

      expect(result.summary.totalDeposits.toNumber()).toBe(0);
      expect(result.summary.totalWithdrawals.toNumber()).toBe(0);
    });
  });
});
