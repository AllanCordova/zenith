import {
  ConflictException,
  INestApplication,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

const ACCESS_SECRET = 'test-access-secret-at-least-32-chars!!';
const session = {
  user: {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Ana',
    email: 'ana@zenith.test',
    role: 'CLIENT' as const,
    createdAt: '2026-01-15T12:00:00.000Z',
  },
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
};

describe('AuthController', () => {
  let app: INestApplication<App>;
  let jwt: JwtService;
  const authService = {
    register: jest.fn(),
    login: jest.fn(),
    refresh: jest.fn(),
    me: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({})],
      controllers: [AuthController],
      providers: [
        JwtAuthGuard,
        { provide: AuthService, useValue: authService },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: (key: string) => {
              if (key === 'JWT_ACCESS_SECRET') return ACCESS_SECRET;
              throw new Error(key);
            },
          },
        },
      ],
    }).compile();

    jwt = module.get(JwtService);
    app = module.createNestApplication();
    app.setGlobalPrefix('api/v1', { exclude: ['/'] });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /auth/register returns 201', async () => {
    authService.register.mockResolvedValue(session);
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'Ana',
        email: 'ana@zenith.test',
        password: 'password1',
        role: 'CLIENT',
      })
      .expect(201)
      .expect(session);
  });

  it('POST /auth/register returns 400 for short password', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'Ana',
        email: 'ana@zenith.test',
        password: 'short',
        role: 'CLIENT',
      })
      .expect(400);
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('POST /auth/register returns 400 for invalid role', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'Ana',
        email: 'ana@zenith.test',
        password: 'password1',
        role: 'ADMIN',
      })
      .expect(400);
  });

  it('POST /auth/register returns 409 when email exists', async () => {
    authService.register.mockRejectedValue(
      new ConflictException('Email already registered'),
    );
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'Ana',
        email: 'ana@zenith.test',
        password: 'password1',
        role: 'CLIENT',
      })
      .expect(409)
      .expect((res) => {
        expect((res.body as { message: string }).message).toBe(
          'Email already registered',
        );
      });
  });

  it('POST /auth/login returns 200', async () => {
    authService.login.mockResolvedValue(session);
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'ana@zenith.test', password: 'password1' })
      .expect(200)
      .expect(session);
  });

  it('POST /auth/login returns 401', async () => {
    authService.login.mockRejectedValue(new UnauthorizedException());
    await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'ana@zenith.test', password: 'password1' })
      .expect(401)
      .expect((res) => {
        expect((res.body as { message: string }).message).toBe('Unauthorized');
      });
  });

  it('POST /auth/refresh returns new tokens', async () => {
    authService.refresh.mockResolvedValue({
      accessToken: 'a2',
      refreshToken: 'r2',
    });
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: 'refresh-token' })
      .expect(200)
      .expect({ accessToken: 'a2', refreshToken: 'r2' });
  });

  it('GET /auth/me without Bearer returns 401', async () => {
    await request(app.getHttpServer()).get('/api/v1/auth/me').expect(401);
  });

  it('GET /auth/me with access token returns user', async () => {
    const access = await jwt.signAsync(
      {
        sub: session.user.id,
        email: session.user.email,
        role: 'CLIENT',
        type: 'access',
      },
      { secret: ACCESS_SECRET, expiresIn: '15m' },
    );
    authService.me.mockResolvedValue(session.user);
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${access}`)
      .expect(200)
      .expect(session.user);
    expect(authService.me).toHaveBeenCalledWith(session.user.id);
  });

  it('GET /auth/me rejects a refresh token', async () => {
    const refresh = await jwt.signAsync(
      {
        sub: session.user.id,
        email: session.user.email,
        role: 'CLIENT',
        type: 'refresh',
      },
      { secret: ACCESS_SECRET, expiresIn: '7d' },
    );
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${refresh}`)
      .expect(401);
    expect(authService.me).not.toHaveBeenCalled();
  });

  it('POST /auth/logout returns 204', async () => {
    authService.logout.mockResolvedValue(undefined);
    await request(app.getHttpServer()).post('/api/v1/auth/logout').expect(204);
  });
});
