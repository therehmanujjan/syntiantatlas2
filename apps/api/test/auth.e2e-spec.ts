import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, ExecutionContext, CanActivate } from '@nestjs/common';
import request from 'supertest';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from '../src/modules/auth/auth.controller';
import { AuthService } from '../src/modules/auth/auth.service';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { AuditService } from '../src/modules/audit/audit.service';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';
import { AuthGuard } from '@nestjs/passport';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs');

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

describe('Auth Flow (e2e)', () => {
  let app: INestApplication;
  let prisma: any;
  let jwtService: JwtService;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    passwordHash: '$2a$12$hashedpassword',
    firstName: 'Test',
    lastName: 'User',
    roleId: 'investor',
    kycStatus: 'pending',
    kycLevel: 1,
    walletBalance: 0,
    phone: null,
    createdAt: new Date('2024-01-01'),
  };

  beforeAll(async () => {
    // Clear env vars so ConfigModule uses our test config
    delete process.env.JWT_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
    delete process.env.JWT_EXPIRY;
    delete process.env.JWT_REFRESH_EXPIRY;

    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              JWT_SECRET: 'test-secret',
              JWT_REFRESH_SECRET: 'test-refresh-secret',
              JWT_EXPIRY: '7d',
              JWT_REFRESH_EXPIRY: '30d',
            }),
          ],
        }),
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '7d' },
        }),
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
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

    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    mockCurrentUser = null;
    prisma.user.findUnique.mockReset();
    prisma.user.create.mockReset();
    prisma.user.update.mockReset();
  });

  // ── Registration ──

  describe('POST /api/auth/register', () => {
    it('should register a new user and return tokens', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2a$12$hashedpassword');

      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123',
          firstName: 'Test',
          lastName: 'User',
          roleId: 'investor',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('test@example.com');
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      expect(res.body.data.user).not.toHaveProperty('passwordHash');
    });

    it('should return 409 for duplicate email', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123',
          firstName: 'Test',
          lastName: 'User',
          roleId: 'investor',
        })
        .expect(409);
    });

    it('should return 400 for invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'not-an-email',
          password: 'Password123',
          firstName: 'Test',
          lastName: 'User',
          roleId: 'investor',
        })
        .expect(400);
    });

    it('should return 400 for short password', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'valid@example.com',
          password: 'short',
          firstName: 'Test',
          lastName: 'User',
          roleId: 'investor',
        })
        .expect(400);
    });

    it('should return 400 for missing required fields', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email: 'test@example.com' })
        .expect(400);
    });

    it('should return 400 for invalid roleId', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123',
          firstName: 'Test',
          lastName: 'User',
          roleId: 'admin',
        })
        .expect(400);
    });
  });

  // ── Login ──

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'Password123' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.email).toBe('test@example.com');
    });

    it('should return 401 for wrong password', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'WrongPass123' })
        .expect(401);
    });

    it('should return 401 for non-existent user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'noone@example.com', password: 'Password123' })
        .expect(401);
    });
  });

  // ── Authenticated endpoints (using MockAuthGuard) ──

  describe('GET /api/auth/me', () => {
    it('should return user profile with authentication', async () => {
      mockCurrentUser = { id: 1, email: 'test@example.com', roleId: 'investor' };
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const res = await request(app.getHttpServer())
        .get('/api/auth/me')
        .expect(200);

      expect(res.body.data.email).toBe('test@example.com');
    });

    it('should return 403 without authentication', async () => {
      mockCurrentUser = null;

      await request(app.getHttpServer())
        .get('/api/auth/me')
        .expect(403);
    });
  });

  // ── Change Password ──

  describe('POST /api/auth/change-password', () => {
    it('should change password with valid current password', async () => {
      mockCurrentUser = { id: 1, email: 'test@example.com', roleId: 'investor' };
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2a$12$newhash');

      const res = await request(app.getHttpServer())
        .post('/api/auth/change-password')
        .send({
          currentPassword: 'Password123',
          newPassword: 'NewPassword456',
        })
        .expect(200);

      expect(res.body.data.message).toBe('Password changed successfully');
    });

    it('should return 400 for incorrect current password', async () => {
      mockCurrentUser = { id: 1, email: 'test@example.com', roleId: 'investor' };
      prisma.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await request(app.getHttpServer())
        .post('/api/auth/change-password')
        .send({
          currentPassword: 'WrongPassword',
          newPassword: 'NewPassword456',
        })
        .expect(400);
    });
  });

  // ── Token Refresh ──

  describe('POST /api/auth/refresh', () => {
    it('should return new tokens with valid refresh token', async () => {
      const refreshToken = jwtService.sign(
        { sub: 1, email: 'test@example.com', roleId: 'investor' },
        { secret: 'test-refresh-secret' },
      );
      prisma.user.findUnique.mockResolvedValue(mockUser);

      const res = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('should return 401 for invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });
  });
});
