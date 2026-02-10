import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from '../users.service';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

describe('UsersService', () => {
  let service: UsersService;
  let prisma: any;
  let auditService: any;

  const mockUser = {
    id: 1,
    email: 'user@test.com',
    passwordHash: '$2a$12$hash',
    firstName: 'John',
    lastName: 'Doe',
    roleId: 'investor',
    kycStatus: 'pending',
    kycLevel: 1,
    walletBalance: 10000,
    phone: '+92300000000',
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      transaction: {
        findMany: jest.fn(),
      },
      staffCredential: {
        create: jest.fn(),
      },
      userAddress: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
      },
      bankAccount: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
      },
    };

    auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  // ── getProfile ──

  describe('getProfile', () => {
    it('should return user profile without passwordHash', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getProfile(1);

      expect(result.email).toBe('user@test.com');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw NotFoundException for non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getProfile(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ── updateProfile ──

  describe('updateProfile', () => {
    it('should update first name and last name', async () => {
      prisma.user.update.mockResolvedValue({ ...mockUser, firstName: 'Jane' });

      const result = await service.updateProfile(1, { firstName: 'Jane' });

      expect(result.firstName).toBe('Jane');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'update_profile' }),
      );
    });
  });

  // ── getWallet ──

  describe('getWallet', () => {
    it('should return wallet balance with recent transactions', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1, walletBalance: 10000 });
      prisma.transaction.findMany.mockResolvedValue([{ id: 1, type: 'deposit' }]);

      const result = await service.getWallet(1);

      expect(result.balance).toBe(10000);
      expect(result.recentTransactions).toHaveLength(1);
    });

    it('should throw NotFoundException for non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getWallet(999)).rejects.toThrow(NotFoundException);
    });
  });

  // ── findAll (admin) ──

  describe('findAll', () => {
    it('should return paginated user list', async () => {
      prisma.user.findMany.mockResolvedValue([mockUser]);
      prisma.user.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it('should filter by role', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.findAll({ roleId: 'seller' });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ roleId: 'seller' }),
        }),
      );
    });

    it('should search by email, first name, last name', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.findAll({ search: 'john' });

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { email: { contains: 'john', mode: 'insensitive' } },
            ]),
          }),
        }),
      );
    });
  });

  // ── createStaff ──

  describe('createStaff', () => {
    it('should create staff member with temp password', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2a$12$hash');
      prisma.user.create.mockResolvedValue({
        ...mockUser,
        roleId: 'operations_manager',
      });
      prisma.staffCredential.create.mockResolvedValue({});

      const result = await service.createStaff(
        {
          email: 'staff@test.com',
          firstName: 'Staff',
          lastName: 'User',
          roleId: 'operations_manager',
        },
        1,
        '127.0.0.1',
      );

      expect(result.temporaryPassword).toBeDefined();
      expect(result.employeeId).toBeDefined();
      expect(prisma.staffCredential.create).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'create_staff' }),
      );
    });

    it('should throw ConflictException for duplicate email', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.createStaff(
          {
            email: 'user@test.com',
            firstName: 'Test',
            lastName: 'User',
            roleId: 'operations_manager',
          },
          1,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ── suspendUser ──

  describe('suspendUser', () => {
    it('should suspend a non-admin user', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({ ...mockUser, status: 'suspended' });

      const result = await service.suspendUser(1, { reason: 'Violation' }, 99);

      expect(result.status).toBe('suspended');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'suspend_user' }),
      );
    });

    it('should throw ForbiddenException when suspending admin', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, roleId: 'admin' });

      await expect(
        service.suspendUser(1, { reason: 'Test' }, 99),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException for non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.suspendUser(999, { reason: 'Test' }, 99),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // ── deactivateUser ──

  describe('deactivateUser', () => {
    it('should deactivate a non-admin user', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue({ ...mockUser, status: 'deactivated' });

      const result = await service.deactivateUser(1, 99);

      expect(result.status).toBe('deactivated');
    });

    it('should throw ForbiddenException when deactivating admin', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...mockUser, roleId: 'admin' });

      await expect(service.deactivateUser(1, 99)).rejects.toThrow(ForbiddenException);
    });
  });

  // ── Addresses ──

  describe('addresses', () => {
    const mockAddress = {
      id: 1,
      userId: 1,
      street: '123 Main',
      city: 'Karachi',
      state: 'Sindh',
      postalCode: '75000',
      country: 'Pakistan',
      isDefault: true,
      createdAt: new Date(),
    };

    it('should return address list', async () => {
      prisma.userAddress.findMany.mockResolvedValue([mockAddress]);

      const result = await service.getAddresses(1);

      expect(result).toHaveLength(1);
    });

    it('should create address and reset default', async () => {
      prisma.userAddress.updateMany.mockResolvedValue({});
      prisma.userAddress.create.mockResolvedValue(mockAddress);

      const result = await service.createAddress(1, {
        street: '123 Main',
        city: 'Karachi',
        state: 'Sindh',
        postalCode: '75000',
        isDefault: true,
      });

      expect(prisma.userAddress.updateMany).toHaveBeenCalled();
      expect(result.city).toBe('Karachi');
    });

    it('should throw NotFoundException when deleting non-existent address', async () => {
      prisma.userAddress.findFirst.mockResolvedValue(null);

      await expect(service.deleteAddress(1, 999)).rejects.toThrow(NotFoundException);
    });
  });

  // ── Bank Accounts ──

  describe('bankAccounts', () => {
    const mockAccount = {
      id: 1,
      userId: 1,
      bankName: 'HBL',
      accountTitle: 'John Doe',
      iban: 'PK36HABB0000001123456702',
      branchCode: '0001',
      isDefault: true,
      createdAt: new Date(),
    };

    it('should return bank account list', async () => {
      prisma.bankAccount.findMany.mockResolvedValue([mockAccount]);

      const result = await service.getBankAccounts(1);

      expect(result).toHaveLength(1);
    });

    it('should create bank account', async () => {
      prisma.bankAccount.create.mockResolvedValue(mockAccount);

      const result = await service.createBankAccount(1, {
        bankName: 'HBL',
        accountTitle: 'John Doe',
        iban: 'PK36HABB0000001123456702',
      });

      expect(result.bankName).toBe('HBL');
    });

    it('should throw NotFoundException when deleting non-existent account', async () => {
      prisma.bankAccount.findFirst.mockResolvedValue(null);

      await expect(service.deleteBankAccount(1, 999)).rejects.toThrow(NotFoundException);
    });
  });
});
