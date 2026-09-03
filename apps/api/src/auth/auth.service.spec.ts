import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { Role, UserRecord } from './user-response';

type CreateUserArgs = {
  data: {
    email: string;
    passwordHash: string;
    name: string;
    role: Role;
  };
};

type JwtPayload = {
  sub: string;
  email: string;
  role: Role;
  type: 'access' | 'refresh';
};

const ACCESS_SECRET = 'test-access-secret-at-least-32-chars!!';
const REFRESH_SECRET = 'test-refresh-secret-at-least-32-chars!';

const sampleUser: UserRecord = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'ana@zenith.test',
  passwordHash: bcrypt.hashSync('password1', 10),
  name: 'Ana',
  role: 'CLIENT',
  createdAt: new Date('2026-01-15T12:00:00.000Z'),
};

describe('AuthService', () => {
  let service: AuthService;
  let jwt: JwtService;
  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      imports: [JwtModule.register({})],
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: (key: string) => {
              const map: Record<string, string> = {
                JWT_ACCESS_SECRET: ACCESS_SECRET,
                JWT_REFRESH_SECRET: REFRESH_SECRET,
              };
              if (!map[key]) throw new Error(key);
              return map[key];
            },
            get: (key: string) => {
              const map: Record<string, string> = {
                JWT_ACCESS_EXPIRES_IN: '15m',
                JWT_REFRESH_EXPIRES_IN: '7d',
              };
              return map[key];
            },
          },
        },
      ],
    }).compile();
    service = module.get(AuthService);
    jwt = module.get(JwtService);
  });

  it('register hashes password, persists user, omits hash, returns tokens', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockImplementation(({ data }: CreateUserArgs) => ({
      id: sampleUser.id,
      email: data.email,
      passwordHash: data.passwordHash,
      name: data.name,
      role: data.role,
      createdAt: sampleUser.createdAt,
    }));

    const result = await service.register({
      name: ' Ana ',
      email: 'Ana@Zenith.test',
      password: 'password1',
      role: 'CLIENT',
    });

    expect(prisma.user.create).toHaveBeenCalled();
    const created = (prisma.user.create.mock.calls as CreateUserArgs[][])[0][0]
      .data;
    expect(created.email).toBe('ana@zenith.test');
    expect(created.name).toBe('Ana');
    expect(created.passwordHash).not.toBe('password1');
    expect(await bcrypt.compare('password1', created.passwordHash)).toBe(true);
    expect(result.user).toEqual({
      id: sampleUser.id,
      name: 'Ana',
      email: 'ana@zenith.test',
      role: 'CLIENT',
      createdAt: '2026-01-15T12:00:00.000Z',
    });
    expect(result.user).not.toHaveProperty('passwordHash');
    const access = await jwt.verifyAsync<JwtPayload>(result.accessToken, {
      secret: ACCESS_SECRET,
    });
    const refresh = await jwt.verifyAsync<JwtPayload>(result.refreshToken, {
      secret: REFRESH_SECRET,
    });
    expect(access).toMatchObject({
      sub: sampleUser.id,
      email: 'ana@zenith.test',
      role: 'CLIENT',
      type: 'access',
    });
    expect(refresh).toMatchObject({ type: 'refresh', sub: sampleUser.id });
  });

  it('register throws ConflictException when email exists', async () => {
    prisma.user.findUnique.mockResolvedValue(sampleUser);
    await expect(
      service.register({
        name: 'Ana',
        email: 'ana@zenith.test',
        password: 'password1',
        role: 'CLIENT',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('register maps Prisma unique race (P2002) to ConflictException', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockRejectedValue({ code: 'P2002' });
    await expect(
      service.register({
        name: 'Ana',
        email: 'ana@zenith.test',
        password: 'password1',
        role: 'CLIENT',
      }),
    ).rejects.toEqual(new ConflictException('Email already registered'));
  });

  it('login returns session for valid credentials', async () => {
    prisma.user.findUnique.mockResolvedValue(sampleUser);
    const result = await service.login({
      email: 'ana@zenith.test',
      password: 'password1',
    });
    expect(result.user.email).toBe('ana@zenith.test');
    expect(result.accessToken).toBeTruthy();
  });

  it('login throws UnauthorizedException for wrong password', async () => {
    prisma.user.findUnique.mockResolvedValue(sampleUser);
    await expect(
      service.login({ email: 'ana@zenith.test', password: 'wrongpass' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('login throws UnauthorizedException when email is unknown', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(
      service.login({ email: 'nope@zenith.test', password: 'password1' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('refresh issues a new pair for a valid refresh token', async () => {
    prisma.user.findUnique.mockResolvedValue(sampleUser);
    const session = await service.login({
      email: 'ana@zenith.test',
      password: 'password1',
    });
    const next = await service.refresh(session.refreshToken);
    expect(next.accessToken).toBeTruthy();
    expect(next.refreshToken).toBeTruthy();
    await expect(
      jwt.verifyAsync(next.accessToken, { secret: ACCESS_SECRET }),
    ).resolves.toMatchObject({ type: 'access' });
  });

  it('refresh rejects an access token', async () => {
    prisma.user.findUnique.mockResolvedValue(sampleUser);
    const session = await service.login({
      email: 'ana@zenith.test',
      password: 'password1',
    });
    await expect(service.refresh(session.accessToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('me returns the user and rejects missing id', async () => {
    prisma.user.findUnique.mockResolvedValue(sampleUser);
    await expect(service.me(sampleUser.id)).resolves.toMatchObject({
      email: 'ana@zenith.test',
    });
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.me('missing')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
