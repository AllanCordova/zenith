# US-AS0 Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cadastro/login JWT no NestJS, sessão em cookies `httpOnly` via BFF no Next.js, e isolamento `/app` (CLIENT) vs `/studio` (TRAINER) com `proxy.ts`.

**Architecture:** O browser fala só com `apps/web`. Route Handlers em `app/api/v1/auth/*` chamam `apps/api` (`/api/v1`), gravam `zenith_access` / `zenith_refresh` e devolvem só `UserResponseDto`. O NestJS persiste `User` (Prisma), hasheia senha (bcrypt 10) e emite JWT. `proxy.ts` faz gate otimista (payload sem verificar assinatura); `JwtAuthGuard` autoriza `/auth/me`.

**Tech Stack:** NestJS 11, Prisma + PostgreSQL, `@nestjs/jwt`, `@nestjs/config`, bcrypt, class-validator, Next.js 16 App Router, Jest.

**Spec:** `specs/US-AS0-auth/spec.md`

## Global Constraints

- Prefixo Nest: `/api/v1` (GET `/` hello permanece fora do prefixo).
- Cookies: `zenith_access` (Max-Age 900) e `zenith_refresh` (Max-Age 604800); `HttpOnly`; `SameSite=Lax`; `Path=/`; `Secure` só se `NODE_ENV === 'production'`.
- JWT access: `JWT_ACCESS_SECRET`, exp `15m`, payload `{ sub, email, role, type: 'access' }`.
- JWT refresh: `JWT_REFRESH_SECRET`, exp `7d`, payload `{ sub, email, role, type: 'refresh' }`.
- `role`: exatamente `TRAINER` | `CLIENT`. Email persistido lowercase + trim. Senha 8–72. Nome 2–100.
- `UserResponseDto` nunca inclui `passwordHash` nem tokens. Browser nunca recebe JWT em JSON.
- 409 message: `Email already registered`. 401 message: `Unauthorized` (sem distinguir e-mail vs senha).
- Browser não chama `:3001`. `API_URL` só no servidor do Next.
- TDD: teste falha → código mínimo → teste passa → commit. Não pular hooks (`--no-verify`).
- Estilo: API com aspas simples (Prettier Nest); web com aspas duplas (Next).

### Mapa de arquivos

**API — criar**

- `apps/api/prisma/schema.prisma`
- `apps/api/src/prisma/prisma.service.ts`
- `apps/api/src/prisma/prisma.module.ts`
- `apps/api/src/auth/user-response.ts`
- `apps/api/src/auth/user-response.spec.ts`
- `apps/api/src/auth/auth.service.ts`
- `apps/api/src/auth/auth.service.spec.ts`
- `apps/api/src/auth/auth.controller.ts`
- `apps/api/src/auth/auth.controller.spec.ts`
- `apps/api/src/auth/jwt-auth.guard.ts`
- `apps/api/src/auth/auth.module.ts`
- `apps/api/src/auth/dto/register-user.dto.ts`
- `apps/api/src/auth/dto/login.dto.ts`
- `apps/api/src/auth/dto/refresh-token.dto.ts`

**API — modificar**

- `apps/api/package.json` (deps + `postinstall`)
- `apps/api/src/app.module.ts`
- `apps/api/src/main.ts`
- `.env.example`, `.env`

**Web — criar**

- `apps/web/lib/auth/constants.ts`
- `apps/web/lib/auth/jwt-payload.ts`
- `apps/web/lib/auth/jwt-payload.test.ts`
- `apps/web/lib/auth/cookies.ts`
- `apps/web/lib/auth/cookies.test.ts`
- `apps/web/lib/auth/nest.ts`
- `apps/web/lib/auth/proxy-gate.ts`
- `apps/web/lib/auth/proxy-gate.test.ts`
- `apps/web/proxy.ts`
- `apps/web/app/api/v1/auth/register/route.ts`
- `apps/web/app/api/v1/auth/register/route.test.ts`
- `apps/web/app/api/v1/auth/login/route.ts`
- `apps/web/app/api/v1/auth/login/route.test.ts`
- `apps/web/app/api/v1/auth/refresh/route.ts`
- `apps/web/app/api/v1/auth/refresh/route.test.ts`
- `apps/web/app/api/v1/auth/logout/route.ts`
- `apps/web/app/api/v1/auth/logout/route.test.ts`
- `apps/web/app/api/v1/auth/me/route.ts`
- `apps/web/app/api/v1/auth/me/route.test.ts`
- `apps/web/app/login/page.tsx`
- `apps/web/app/login/login-form.tsx`
- `apps/web/app/login/page.test.tsx`
- `apps/web/app/register/page.tsx`
- `apps/web/app/register/register-form.tsx`
- `apps/web/app/register/page.test.tsx`
- `apps/web/app/app/page.tsx`
- `apps/web/app/app/page.test.tsx`
- `apps/web/app/studio/page.tsx`
- `apps/web/app/studio/page.test.tsx`
- `apps/web/components/auth/user-session.tsx`
- `apps/web/.env.example`

**Web — modificar**

- `apps/web/jest.setup.ts`
- `apps/web/app/page.tsx`
- `apps/web/app/page.test.tsx`
- `apps/web/app/layout.tsx` (título)

**Docs / CI**

- `docs/prd.md`, `docs/sdd.md`, `.github/workflows/ci.yml`

---

### Task 1: Prisma User + `toUserResponse`

**Files:**

- Create: `apps/api/prisma/schema.prisma`
- Create: `apps/api/src/prisma/prisma.service.ts`
- Create: `apps/api/src/prisma/prisma.module.ts`
- Create: `apps/api/src/auth/user-response.ts`
- Test: `apps/api/src/auth/user-response.spec.ts`
- Modify: `apps/api/package.json`
- Modify: `.env.example`
- Modify: `.env` (gitignored; só local)

**Interfaces:**

- Consumes: nada
- Produces: `export type Role = 'TRAINER' | 'CLIENT'`
- Produces: `export type UserRecord = { id: string; email: string; passwordHash: string; name: string; role: Role; createdAt: Date }`
- Produces: `export type UserResponseDto = { id: string; name: string; email: string; role: Role; createdAt: string }`
- Produces: `export function toUserResponse(user: UserRecord): UserResponseDto`
- Produces: `PrismaService` extends `PrismaClient`; `PrismaModule` `@Global()` exports `PrismaService`

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/auth/user-response.spec.ts`:

```ts
import { toUserResponse, UserRecord } from './user-response';

describe('toUserResponse', () => {
  const user: UserRecord = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'ana@zenith.test',
    passwordHash: 'hashed',
    name: 'Ana',
    role: 'CLIENT',
    createdAt: new Date('2026-01-15T12:00:00.000Z'),
  };

  it('omits passwordHash and serializes createdAt as ISO', () => {
    const dto = toUserResponse(user);
    expect(dto).toEqual({
      id: user.id,
      name: 'Ana',
      email: 'ana@zenith.test',
      role: 'CLIENT',
      createdAt: '2026-01-15T12:00:00.000Z',
    });
    expect(dto).not.toHaveProperty('passwordHash');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/api && npm test -- --testPathPattern=user-response.spec.ts`

Expected: FAIL — `Cannot find module './user-response'`

- [ ] **Step 3: Write minimal implementation + Prisma**

Create `apps/api/src/auth/user-response.ts`:

```ts
export type Role = 'TRAINER' | 'CLIENT';

export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: Role;
  createdAt: Date;
};

export type UserResponseDto = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
};

export function toUserResponse(user: UserRecord): UserResponseDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}
```

From `apps/api`:

```bash
npm install @prisma/client
npm install -D prisma
```

Create `apps/api/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  TRAINER
  CLIENT
}

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  name         String
  role         Role
  createdAt    DateTime @default(now())
}
```

Create `apps/api/src/prisma/prisma.service.ts`:

```ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }
}
```

Create `apps/api/src/prisma/prisma.module.ts`:

```ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

In `apps/api/package.json` scripts, add `"postinstall": "prisma generate"` (keep scripts existing). Then:

```bash
npx prisma generate
```

Expected: `Generated Prisma Client`

Append to repo-root `.env.example` and `.env`:

```
JWT_ACCESS_SECRET=change-me-access-secret-min-32-chars
JWT_REFRESH_SECRET=change-me-refresh-secret-min-32-chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
API_URL=http://localhost:3001
```

Do not commit `.env`.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/api && npm test -- --testPathPattern=user-response.spec.ts`

Expected: PASS (1 test). Existing `app.controller.spec.ts` still PASS (`cd apps/api && npm test`).

- [ ] **Step 5: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma apps/api/src/prisma apps/api/src/auth/user-response.ts apps/api/src/auth/user-response.spec.ts apps/api/package.json apps/api/package-lock.json .env.example
git commit -m "$(cat <<'EOF'
feat(auth): add User Prisma model and UserResponse mapper

EOF
)"
```

---

### Task 2: AuthService (register, login, refresh, me)

**Files:**

- Create: `apps/api/src/auth/auth.service.ts`
- Test: `apps/api/src/auth/auth.service.spec.ts`
- Modify: `apps/api/package.json`

**Interfaces:**

- Consumes: `toUserResponse`, `UserRecord`, `UserResponseDto`, `Role` from `./user-response`
- Consumes: `PrismaService.user.findUnique` / `create`
- Produces: `AuthSessionResponseDto = { user: UserResponseDto; accessToken: string; refreshToken: string }`
- Produces: `AuthService.register(input: { name: string; email: string; password: string; role: Role }): Promise<AuthSessionResponseDto>`
- Produces: `AuthService.login(input: { email: string; password: string }): Promise<AuthSessionResponseDto>`
- Produces: `AuthService.refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }>`
- Produces: `AuthService.me(userId: string): Promise<UserResponseDto>`
- Produces: `AuthService.logout(): Promise<void>` (no-op)

Use secrets in tests:

- `JWT_ACCESS_SECRET=test-access-secret-at-least-32-chars!!`
- `JWT_REFRESH_SECRET=test-refresh-secret-at-least-32-chars!`

- [ ] **Step 1: Write the failing test**

From `apps/api`:

```bash
npm install @nestjs/jwt @nestjs/config bcrypt
npm install -D @types/bcrypt
```

Create `apps/api/src/auth/auth.service.spec.ts`:

```ts
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { UserRecord } from './user-response';

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
    prisma.user.create.mockImplementation(async ({ data }) => ({
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
    const created = prisma.user.create.mock.calls[0][0].data;
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
    const access = await jwt.verifyAsync(result.accessToken, {
      secret: ACCESS_SECRET,
    });
    const refresh = await jwt.verifyAsync(result.refreshToken, {
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/api && npm test -- --testPathPattern=auth.service.spec.ts`

Expected: FAIL — `Cannot find module './auth.service'`

- [ ] **Step 3: Write minimal implementation**

Create `apps/api/src/auth/auth.service.ts`:

```ts
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import {
  Role,
  toUserResponse,
  UserRecord,
  UserResponseDto,
} from './user-response';

export type AuthSessionResponseDto = {
  user: UserResponseDto;
  accessToken: string;
  refreshToken: string;
};

type JwtType = 'access' | 'refresh';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(input: {
    name: string;
    email: string;
    password: string;
    role: Role;
  }): Promise<AuthSessionResponseDto> {
    const email = input.email.trim().toLowerCase();
    const name = input.name.trim();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await this.prisma.user.create({
      data: { email, name, passwordHash, role: input.role },
    });
    return this.issueSession(user as UserRecord);
  }

  async login(input: {
    email: string;
    password: string;
  }): Promise<AuthSessionResponseDto> {
    const email = input.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException();
    }
    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException();
    }
    return this.issueSession(user as UserRecord);
  }

  async refresh(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = await this.verifyToken(refreshToken, 'refresh');
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) {
      throw new UnauthorizedException();
    }
    return {
      accessToken: await this.sign(user as UserRecord, 'access'),
      refreshToken: await this.sign(user as UserRecord, 'refresh'),
    };
  }

  async me(userId: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }
    return toUserResponse(user as UserRecord);
  }

  async logout(): Promise<void> {
    return;
  }

  private async issueSession(user: UserRecord): Promise<AuthSessionResponseDto> {
    return {
      user: toUserResponse(user),
      accessToken: await this.sign(user, 'access'),
      refreshToken: await this.sign(user, 'refresh'),
    };
  }

  private sign(user: UserRecord, type: JwtType): Promise<string> {
    const secret =
      type === 'access'
        ? this.config.getOrThrow<string>('JWT_ACCESS_SECRET')
        : this.config.getOrThrow<string>('JWT_REFRESH_SECRET');
    const expiresIn =
      type === 'access'
        ? (this.config.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m')
        : (this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d');
    return this.jwt.signAsync(
      { sub: user.id, email: user.email, role: user.role, type },
      { secret, expiresIn },
    );
  }

  private async verifyToken(
    token: string,
    type: JwtType,
  ): Promise<{ sub: string; email: string; role: Role; type: JwtType }> {
    const secret =
      type === 'access'
        ? this.config.getOrThrow<string>('JWT_ACCESS_SECRET')
        : this.config.getOrThrow<string>('JWT_REFRESH_SECRET');
    try {
      const payload = await this.jwt.verifyAsync<{
        sub: string;
        email: string;
        role: Role;
        type: JwtType;
      }>(token, { secret });
      if (payload.type !== type) {
        throw new UnauthorizedException();
      }
      return payload;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/api && npm test -- --testPathPattern=auth.service.spec.ts`

Expected: PASS (all cases above). Then `cd apps/api && npm test` — all green.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/auth/auth.service.ts apps/api/src/auth/auth.service.spec.ts apps/api/package.json apps/api/package-lock.json
git commit -m "$(cat <<'EOF'
feat(auth): issue access and refresh JWTs from AuthService

EOF
)"
```

---

### Task 3: HTTP Auth (DTOs, guard, controller, prefix)

**Files:**

- Create: `apps/api/src/auth/dto/register-user.dto.ts`
- Create: `apps/api/src/auth/dto/login.dto.ts`
- Create: `apps/api/src/auth/dto/refresh-token.dto.ts`
- Create: `apps/api/src/auth/jwt-auth.guard.ts`
- Create: `apps/api/src/auth/auth.controller.ts`
- Create: `apps/api/src/auth/auth.module.ts`
- Test: `apps/api/src/auth/auth.controller.spec.ts`
- Modify: `apps/api/src/app.module.ts`
- Modify: `apps/api/src/main.ts`
- Modify: `apps/api/package.json`

**Interfaces:**

- Consumes: `AuthService.register/login/refresh/me/logout` (Task 2)
- Produces HTTP:
  - `POST /api/v1/auth/register` → 201 `AuthSessionResponseDto`
  - `POST /api/v1/auth/login` → 200 `AuthSessionResponseDto`
  - `POST /api/v1/auth/refresh` body `{ refreshToken: string }` → 200 `{ accessToken, refreshToken }`
  - `GET /api/v1/auth/me` header `Authorization: Bearer <access>` → 200 `UserResponseDto`
  - `POST /api/v1/auth/logout` → 204
- Produces: `JwtAuthGuard` sets `request.user = { sub, email, role, type: 'access' }`
- Produces: `main.ts` `setGlobalPrefix('api/v1', { exclude: ['/'] })` and `ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true })`

- [ ] **Step 1: Write the failing test**

From `apps/api`:

```bash
npm install class-validator class-transformer
```

Create `apps/api/src/auth/auth.controller.spec.ts`:

```ts
import { ConflictException, INestApplication, UnauthorizedException, ValidationPipe } from '@nestjs/common';
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
        expect(res.body.message).toBe('Email already registered');
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
        expect(res.body.message).toBe('Unauthorized');
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/api && npm test -- --testPathPattern=auth.controller.spec.ts`

Expected: FAIL — `Cannot find module './auth.controller'`

- [ ] **Step 3: Write minimal implementation**

`apps/api/src/auth/dto/register-user.dto.ts`:

```ts
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Role } from '../user-response';

export class RegisterUserDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @IsIn(['TRAINER', 'CLIENT'])
  role: Role;
}
```

`apps/api/src/auth/dto/login.dto.ts`:

```ts
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}
```

`apps/api/src/auth/dto/refresh-token.dto.ts`:

```ts
import { IsString, MinLength } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @MinLength(1)
  refreshToken: string;
}
```

`apps/api/src/auth/jwt-auth.guard.ts`:

```ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Role } from './user-response';

export type AuthUser = {
  sub: string;
  email: string;
  role: Role;
  type: 'access';
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const header = request.headers.authorization;
    const token =
      typeof header === 'string' && header.startsWith('Bearer ')
        ? header.slice(7)
        : undefined;
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.jwt.verifyAsync<AuthUser>(token, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
      if (payload.type !== 'access') {
        throw new UnauthorizedException();
      }
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
```

`apps/api/src/auth/auth.controller.ts`:

```ts
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { AuthUser, JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterUserDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() request: Request & { user: AuthUser }) {
    return this.authService.me(request.user.sub);
  }

  @Post('logout')
  @HttpCode(204)
  logout() {
    return this.authService.logout();
  }
}
```

`apps/api/src/auth/auth.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
```

Replace `apps/api/src/app.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [join(process.cwd(), '../../.env'), '.env'],
    }),
    PrismaModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

Replace `apps/api/src/main.ts`:

```ts
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1', { exclude: ['/'] });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
```

In the controller spec, the “rejects a refresh token” case signs with `ACCESS_SECRET` and `type: 'refresh'` so the guard’s `payload.type !== 'access'` path is hit.

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/api && npm test -- --testPathPattern=auth.controller.spec.ts`

Expected: PASS. Then `cd apps/api && npm test` and `cd apps/api && npm run lint:check`.

If prettier fails, `cd apps/api && npm run format` and re-run lint.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/auth apps/api/src/app.module.ts apps/api/src/main.ts apps/api/package.json apps/api/package-lock.json
git commit -m "$(cat <<'EOF'
feat(auth): expose Nest auth HTTP API under /api/v1

EOF
)"
```

---

### Task 4: BFF cookies, Nest client, register + login routes

**Files:**

- Create: `apps/web/lib/auth/constants.ts`
- Create: `apps/web/lib/auth/jwt-payload.ts`
- Test: `apps/web/lib/auth/jwt-payload.test.ts`
- Create: `apps/web/lib/auth/cookies.ts`
- Test: `apps/web/lib/auth/cookies.test.ts`
- Create: `apps/web/lib/auth/nest.ts`
- Create: `apps/web/app/api/v1/auth/register/route.ts`
- Test: `apps/web/app/api/v1/auth/register/route.test.ts`
- Create: `apps/web/app/api/v1/auth/login/route.ts`
- Test: `apps/web/app/api/v1/auth/login/route.test.ts`
- Modify: `apps/web/jest.setup.ts`
- Create: `apps/web/.env.example`

**Interfaces:**

- Produces: `ACCESS_COOKIE = 'zenith_access'`, `REFRESH_COOKIE = 'zenith_refresh'`, `ACCESS_MAX_AGE = 900`, `REFRESH_MAX_AGE = 604800`
- Produces: `decodeJwtPayload(token: string): { sub?: string; email?: string; role?: string; type?: string } | null`
- Produces: `withAuthCookies(res: NextResponse, accessToken: string, refreshToken: string): NextResponse`
- Produces: `clearAuthCookies(res: NextResponse): NextResponse`
- Produces: `nestFetch(path: string, init?: RequestInit): Promise<Response>` using `process.env.API_URL` (no trailing slash)
- Produces: `POST` register → Nest `POST /api/v1/auth/register`; on 201 set cookies and JSON user only
- Produces: `POST` login → Nest `POST /api/v1/auth/login`; on 200 same

- [ ] **Step 1: Write the failing tests**

Replace `apps/web/jest.setup.ts`:

```ts
import "@testing-library/jest-dom";

process.env.API_URL = "http://localhost:3001";
```

Create `apps/web/lib/auth/jwt-payload.test.ts`:

```ts
import { decodeJwtPayload } from "./jwt-payload";

function fakeJwt(payload: object): string {
  const header = Buffer.from(JSON.stringify({ alg: "none" })).toString(
    "base64url",
  );
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${header}.${body}.sig`;
}

describe("decodeJwtPayload", () => {
  it("reads role from the JWT payload without verifying signature", () => {
    const token = fakeJwt({
      sub: "1",
      email: "ana@zenith.test",
      role: "CLIENT",
      type: "access",
    });
    expect(decodeJwtPayload(token)).toMatchObject({
      role: "CLIENT",
      type: "access",
    });
  });

  it("returns null for garbage", () => {
    expect(decodeJwtPayload("not-a-jwt")).toBeNull();
  });
});
```

Create `apps/web/lib/auth/cookies.test.ts`:

```ts
import { NextResponse } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "./constants";
import { clearAuthCookies, withAuthCookies } from "./cookies";

describe("auth cookies", () => {
  it("sets httpOnly cookies without exposing tokens in JSON", () => {
    const res = withAuthCookies(
      NextResponse.json({ id: "1" }),
      "access-token",
      "refresh-token",
    );
    const cookies = res.headers.getSetCookie().join("\n");
    expect(cookies).toMatch(new RegExp(`${ACCESS_COOKIE}=access-token`));
    expect(cookies).toMatch(new RegExp(`${REFRESH_COOKIE}=refresh-token`));
    expect(cookies).toMatch(/HttpOnly/i);
    expect(cookies).toMatch(/SameSite=Lax/i);
    expect(cookies).not.toMatch(/Secure/i);
  });

  it("clears cookies with Max-Age=0", () => {
    const res = clearAuthCookies(NextResponse.json(null, { status: 204 }));
    const cookies = res.headers.getSetCookie().join("\n");
    expect(cookies).toMatch(/Max-Age=0/i);
  });
});
```

Create `apps/web/app/api/v1/auth/login/route.test.ts`:

```ts
import { NextRequest } from "next/server";
import { POST } from "./route";

const user = {
  id: "1",
  name: "Ana",
  email: "ana@zenith.test",
  role: "CLIENT",
  createdAt: "2026-01-15T12:00:00.000Z",
};

describe("POST /api/v1/auth/login", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("sets httpOnly cookies and returns only the user", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          user,
          accessToken: "acc",
          refreshToken: "ref",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    const req = new NextRequest("http://localhost:3000/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "ana@zenith.test",
        password: "password1",
      }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual(user);
    const cookies = res.headers.getSetCookie().join("\n");
    expect(cookies).toMatch(/zenith_access=acc/);
    expect(cookies).toMatch(/HttpOnly/i);
  });

  it("forwards 401 without session cookies", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ statusCode: 401, message: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      }),
    );
    const req = new NextRequest("http://localhost:3000/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "ana@zenith.test",
        password: "password1",
      }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
    expect(res.headers.getSetCookie().join("\n")).not.toMatch(/zenith_access=acc/);
  });
});
```

Create `apps/web/app/api/v1/auth/register/route.test.ts`:

```ts
import { NextRequest } from "next/server";
import { POST } from "./route";

const user = {
  id: "1",
  name: "Ana",
  email: "ana@zenith.test",
  role: "CLIENT",
  createdAt: "2026-01-15T12:00:00.000Z",
};

describe("POST /api/v1/auth/register", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("sets httpOnly cookies and returns only the user", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          user,
          accessToken: "acc",
          refreshToken: "ref",
        }),
        { status: 201, headers: { "content-type": "application/json" } },
      ),
    );
    const req = new NextRequest("http://localhost:3000/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Ana",
        email: "ana@zenith.test",
        password: "password1",
        role: "CLIENT",
      }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toEqual(user);
    const cookies = res.headers.getSetCookie().join("\n");
    expect(cookies).toMatch(/zenith_access=acc/);
    expect(cookies).toMatch(/HttpOnly/i);
  });

  it("forwards 409 without session cookies", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          statusCode: 409,
          message: "Email already registered",
        }),
        { status: 409, headers: { "content-type": "application/json" } },
      ),
    );
    const req = new NextRequest("http://localhost:3000/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name: "Ana",
        email: "ana@zenith.test",
        password: "password1",
        role: "CLIENT",
      }),
      headers: { "content-type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(409);
    expect(res.headers.getSetCookie().join("\n")).not.toMatch(
      /zenith_access=acc/,
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/web && npm test -- --testPathPattern='jwt-payload|cookies|auth/login/route|auth/register/route'`

Expected: FAIL — missing modules `./jwt-payload`, `./cookies`, `./route`.

- [ ] **Step 3: Write minimal implementation**

`apps/web/lib/auth/constants.ts`:

```ts
export const ACCESS_COOKIE = "zenith_access";
export const REFRESH_COOKIE = "zenith_refresh";
export const ACCESS_MAX_AGE = 900;
export const REFRESH_MAX_AGE = 604800;
```

`apps/web/lib/auth/jwt-payload.ts`:

```ts
export type JwtRolePayload = {
  sub?: string;
  email?: string;
  role?: string;
  type?: string;
};

function base64UrlDecode(segment: string): string {
  const padded = segment.replace(/-/g, "+").replace(/_/g, "/");
  const pad =
    padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return atob(padded + pad);
}

export function decodeJwtPayload(token: string): JwtRolePayload | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    return JSON.parse(base64UrlDecode(parts[1])) as JwtRolePayload;
  } catch {
    return null;
  }
}
```

`apps/web/lib/auth/cookies.ts`:

```ts
import { NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  ACCESS_MAX_AGE,
  REFRESH_COOKIE,
  REFRESH_MAX_AGE,
} from "./constants";

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
    secure: process.env.NODE_ENV === "production",
  };
}

export function withAuthCookies(
  res: NextResponse,
  accessToken: string,
  refreshToken: string,
): NextResponse {
  res.cookies.set(ACCESS_COOKIE, accessToken, cookieOptions(ACCESS_MAX_AGE));
  res.cookies.set(REFRESH_COOKIE, refreshToken, cookieOptions(REFRESH_MAX_AGE));
  return res;
}

export function clearAuthCookies(res: NextResponse): NextResponse {
  res.cookies.set(ACCESS_COOKIE, "", cookieOptions(0));
  res.cookies.set(REFRESH_COOKIE, "", cookieOptions(0));
  return res;
}
```

`apps/web/lib/auth/nest.ts`:

```ts
export function apiUrl(): string {
  const url = process.env.API_URL;
  if (!url) {
    throw new Error("API_URL is not set");
  }
  return url.replace(/\/$/, "");
}

export async function nestFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  return fetch(`${apiUrl()}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

export async function forwardNestError(nestRes: Response): Promise<Response> {
  const body = await nestRes.text();
  return new Response(body, {
    status: nestRes.status,
    headers: { "content-type": nestRes.headers.get("content-type") ?? "application/json" },
  });
}
```

`apps/web/app/api/v1/auth/register/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { withAuthCookies } from "@/lib/auth/cookies";
import { forwardNestError, nestFetch } from "@/lib/auth/nest";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const nestRes = await nestFetch("/api/v1/auth/register", {
    method: "POST",
    body,
  });
  if (nestRes.status !== 201) {
    return forwardNestError(nestRes);
  }
  const data = (await nestRes.json()) as {
    user: unknown;
    accessToken: string;
    refreshToken: string;
  };
  return withAuthCookies(
    NextResponse.json(data.user, { status: 201 }),
    data.accessToken,
    data.refreshToken,
  );
}
```

`apps/web/app/api/v1/auth/login/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { withAuthCookies } from "@/lib/auth/cookies";
import { forwardNestError, nestFetch } from "@/lib/auth/nest";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const nestRes = await nestFetch("/api/v1/auth/login", {
    method: "POST",
    body,
  });
  if (nestRes.status !== 200) {
    return forwardNestError(nestRes);
  }
  const data = (await nestRes.json()) as {
    user: unknown;
    accessToken: string;
    refreshToken: string;
  };
  return withAuthCookies(
    NextResponse.json(data.user, { status: 200 }),
    data.accessToken,
    data.refreshToken,
  );
}
```

Create `apps/web/.env.example`:

```
API_URL=http://localhost:3001
```

If `apps/web/.env` does not exist, copy that line into it (gitignored if covered by root `.env*`; if Next does not load the repo-root `.env`, keep `apps/web/.env` with `API_URL`).

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/web && npm test -- --testPathPattern='jwt-payload|cookies|auth/login/route|auth/register/route'`

Expected: PASS. Then `cd apps/web && npm test` (update nothing else yet; home test still passes).

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/auth apps/web/app/api/v1/auth/register apps/web/app/api/v1/auth/login apps/web/jest.setup.ts apps/web/.env.example
git commit -m "$(cat <<'EOF'
feat(web): add BFF login and register cookie session

EOF
)"
```

---

### Task 5: BFF refresh, logout, silent `/me`

**Files:**

- Create: `apps/web/app/api/v1/auth/refresh/route.ts`
- Test: `apps/web/app/api/v1/auth/refresh/route.test.ts`
- Create: `apps/web/app/api/v1/auth/logout/route.ts`
- Test: `apps/web/app/api/v1/auth/logout/route.test.ts`
- Create: `apps/web/app/api/v1/auth/me/route.ts`
- Test: `apps/web/app/api/v1/auth/me/route.test.ts`

**Interfaces:**

- Consumes: `nestFetch`, `withAuthCookies`, `clearAuthCookies`, cookie names (Task 4)
- Produces: `POST /api/v1/auth/refresh` reads `zenith_refresh`; Nest ok → new cookies 200 `{ ok: true }`; else clear cookies 401
- Produces: `POST /api/v1/auth/logout` always `clearAuthCookies` + 204; `nestFetch POST /api/v1/auth/logout` best-effort (ignore failure)
- Produces: `GET /api/v1/auth/me` Bearer from access; if 401 and refresh present, refresh **once** and retry `/me`; failure clears cookies 401

Refresh BFF JSON may be `{ ok: true }` (browser does not need tokens). That matches the spec (no JWT in JSON).

- [ ] **Step 1: Write the failing tests**

`apps/web/app/api/v1/auth/refresh/route.test.ts`:

```ts
import { NextRequest } from "next/server";
import { POST } from "./route";

function reqWithRefresh() {
  return new NextRequest("http://localhost:3000/api/v1/auth/refresh", {
    method: "POST",
    headers: { cookie: "zenith_refresh=old-refresh" },
  });
}

describe("POST /api/v1/auth/refresh", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renews cookies on Nest success", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ accessToken: "new-acc", refreshToken: "new-ref" }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    const res = await POST(reqWithRefresh());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.accessToken).toBeUndefined();
    expect(res.headers.getSetCookie().join("\n")).toMatch(/zenith_access=new-acc/);
  });

  it("clears cookies on Nest 401", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ statusCode: 401, message: "Unauthorized" }), {
        status: 401,
      }),
    );
    const res = await POST(reqWithRefresh());
    expect(res.status).toBe(401);
    expect(res.headers.getSetCookie().join("\n")).toMatch(/Max-Age=0/i);
  });
});
```

`apps/web/app/api/v1/auth/logout/route.test.ts`:

```ts
import { NextRequest } from "next/server";
import { POST } from "./route";

describe("POST /api/v1/auth/logout", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("clears cookies even when Nest fails", async () => {
    jest.spyOn(global, "fetch").mockRejectedValue(new Error("down"));
    const res = await POST(
      new NextRequest("http://localhost:3000/api/v1/auth/logout", {
        method: "POST",
      }),
    );
    expect(res.status).toBe(204);
    expect(res.headers.getSetCookie().join("\n")).toMatch(/Max-Age=0/i);
  });
});
```

`apps/web/app/api/v1/auth/me/route.test.ts`:

```ts
import { NextRequest } from "next/server";
import { GET } from "./route";

const user = {
  id: "1",
  name: "Ana",
  email: "ana@zenith.test",
  role: "CLIENT",
  createdAt: "2026-01-15T12:00:00.000Z",
};

describe("GET /api/v1/auth/me", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns the user when access is valid", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify(user), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    const res = await GET(
      new NextRequest("http://localhost:3000/api/v1/auth/me", {
        headers: { cookie: "zenith_access=acc; zenith_refresh=ref" },
      }),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual(user);
  });

  it("refreshes once when access is rejected", async () => {
    const fetchMock = jest.spyOn(global, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 }),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ accessToken: "new-acc", refreshToken: "new-ref" }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(user), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    const res = await GET(
      new NextRequest("http://localhost:3000/api/v1/auth/me", {
        headers: { cookie: "zenith_access=stale; zenith_refresh=ref" },
      }),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual(user);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(res.headers.getSetCookie().join("\n")).toMatch(/zenith_access=new-acc/);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/web && npm test -- --testPathPattern='auth/refresh/route|auth/logout/route|auth/me/route'`

Expected: FAIL — missing `./route`.

- [ ] **Step 3: Write minimal implementation**

`apps/web/app/api/v1/auth/refresh/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { REFRESH_COOKIE } from "@/lib/auth/constants";
import { clearAuthCookies, withAuthCookies } from "@/lib/auth/cookies";
import { nestFetch } from "@/lib/auth/nest";

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    return clearAuthCookies(
      NextResponse.json(
        { statusCode: 401, message: "Unauthorized" },
        { status: 401 },
      ),
    );
  }
  const nestRes = await nestFetch("/api/v1/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
  if (!nestRes.ok) {
    return clearAuthCookies(
      NextResponse.json(
        { statusCode: 401, message: "Unauthorized" },
        { status: 401 },
      ),
    );
  }
  const tokens = (await nestRes.json()) as {
    accessToken: string;
    refreshToken: string;
  };
  return withAuthCookies(NextResponse.json({ ok: true }), tokens.accessToken, tokens.refreshToken);
}
```

`apps/web/app/api/v1/auth/logout/route.ts`:

```ts
import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/auth/cookies";
import { nestFetch } from "@/lib/auth/nest";

export async function POST() {
  try {
    await nestFetch("/api/v1/auth/logout", { method: "POST" });
  } catch {
    // best-effort
  }
  return clearAuthCookies(new NextResponse(null, { status: 204 }));
}
```

`apps/web/app/api/v1/auth/me/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth/constants";
import { clearAuthCookies, withAuthCookies } from "@/lib/auth/cookies";
import { nestFetch } from "@/lib/auth/nest";

async function nestMe(accessToken: string): Promise<Response> {
  return nestFetch("/api/v1/auth/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

async function nestRefresh(refreshToken: string) {
  const nestRes = await nestFetch("/api/v1/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
  if (!nestRes.ok) return null;
  return nestRes.json() as Promise<{ accessToken: string; refreshToken: string }>;
}

export async function GET(request: NextRequest) {
  let access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!access && !refresh) {
    return NextResponse.json(
      { statusCode: 401, message: "Unauthorized" },
      { status: 401 },
    );
  }

  let rotated: { accessToken: string; refreshToken: string } | null = null;
  if (!access && refresh) {
    rotated = await nestRefresh(refresh);
    if (!rotated) {
      return clearAuthCookies(
        NextResponse.json(
          { statusCode: 401, message: "Unauthorized" },
          { status: 401 },
        ),
      );
    }
    access = rotated.accessToken;
  }

  let meRes = await nestMe(access as string);
  if (meRes.status === 401 && refresh && !rotated) {
    rotated = await nestRefresh(refresh);
    if (!rotated) {
      return clearAuthCookies(
        NextResponse.json(
          { statusCode: 401, message: "Unauthorized" },
          { status: 401 },
        ),
      );
    }
    meRes = await nestMe(rotated.accessToken);
  }

  if (!meRes.ok) {
    const res = NextResponse.json(
      { statusCode: 401, message: "Unauthorized" },
      { status: 401 },
    );
    return meRes.status === 401 ? clearAuthCookies(res) : res;
  }

  const user = await meRes.json();
  const res = NextResponse.json(user, { status: 200 });
  if (rotated) {
    return withAuthCookies(res, rotated.accessToken, rotated.refreshToken);
  }
  return res;
}
```

`nestFetch` currently always sets `content-type: application/json`. That is fine for GET `/me`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/web && npm test -- --testPathPattern='auth/refresh/route|auth/logout/route|auth/me/route'`

Expected: PASS. Then `cd apps/web && npm test`.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/api/v1/auth/refresh apps/web/app/api/v1/auth/logout apps/web/app/api/v1/auth/me
git commit -m "$(cat <<'EOF'
feat(web): refresh session cookies and silent /me retry

EOF
)"
```

---

### Task 6: `proxy-gate` + `proxy.ts`

**Files:**

- Create: `apps/web/lib/auth/proxy-gate.ts`
- Test: `apps/web/lib/auth/proxy-gate.test.ts`
- Create: `apps/web/proxy.ts`

**Interfaces:**

- Produces: `export type SessionHint = { hasSession: boolean; role?: 'TRAINER' | 'CLIENT' }`
- Produces: `export function decideProxy(pathname: string, session: SessionHint): { redirect: string } | null`
- Produces: `export function proxy(request: NextRequest): NextResponse` in `apps/web/proxy.ts`
- Produces: `export const config = { matcher: ['/', '/login', '/register', '/app/:path*', '/studio/:path*'] }`

Rules (verbatim from spec):

- No session on `/`, `/app`, `/studio` → `/login`
- Session + readable role on `/login` or `/register` → `/app` or `/studio`
- `CLIENT` on `/studio` → `/app`
- `TRAINER` on `/app` → `/studio`
- Only refresh (session true, role maybe set) on `/app` or `/studio` → `null` (let through) unless role mismatch
- `/` with role → area for role

- [ ] **Step 1: Write the failing test**

`apps/web/lib/auth/proxy-gate.test.ts`:

```ts
import { decideProxy } from "./proxy-gate";

describe("decideProxy", () => {
  it("sends anonymous /app to login", () => {
    expect(decideProxy("/app", { hasSession: false })).toEqual({
      redirect: "/login",
    });
  });

  it("sends CLIENT away from /studio", () => {
    expect(
      decideProxy("/studio", { hasSession: true, role: "CLIENT" }),
    ).toEqual({ redirect: "/app" });
  });

  it("sends TRAINER from /login to /studio", () => {
    expect(
      decideProxy("/login", { hasSession: true, role: "TRAINER" }),
    ).toEqual({ redirect: "/studio" });
  });

  it("lets CLIENT stay on /app", () => {
    expect(
      decideProxy("/app", { hasSession: true, role: "CLIENT" }),
    ).toBeNull();
  });

  it("lets session without role through /app (refresh-only)", () => {
    expect(decideProxy("/app", { hasSession: true })).toBeNull();
  });

  it("sends / with CLIENT to /app", () => {
    expect(decideProxy("/", { hasSession: true, role: "CLIENT" })).toEqual({
      redirect: "/app",
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd apps/web && npm test -- --testPathPattern=proxy-gate.test.ts`

Expected: FAIL — `Cannot find module './proxy-gate'`

- [ ] **Step 3: Write minimal implementation**

`apps/web/lib/auth/proxy-gate.ts`:

```ts
export type SessionHint = {
  hasSession: boolean;
  role?: "TRAINER" | "CLIENT";
};

function areaForRole(role: "TRAINER" | "CLIENT"): "/app" | "/studio" {
  return role === "CLIENT" ? "/app" : "/studio";
}

export function decideProxy(
  pathname: string,
  session: SessionHint,
): { redirect: string } | null {
  const isApp = pathname === "/app" || pathname.startsWith("/app/");
  const isStudio = pathname === "/studio" || pathname.startsWith("/studio/");
  const isRoot = pathname === "/";
  const isAuthPage = pathname === "/login" || pathname === "/register";

  if ((isRoot || isApp || isStudio) && !session.hasSession) {
    return { redirect: "/login" };
  }

  if (isAuthPage && session.hasSession && session.role) {
    return { redirect: areaForRole(session.role) };
  }

  if (isStudio && session.role === "CLIENT") {
    return { redirect: "/app" };
  }
  if (isApp && session.role === "TRAINER") {
    return { redirect: "/studio" };
  }

  if (isRoot && session.role) {
    return { redirect: areaForRole(session.role) };
  }

  return null;
}
```

`apps/web/proxy.ts` (project root of Next app, same level as `app/`):

```ts
import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth/constants";
import { decodeJwtPayload } from "@/lib/auth/jwt-payload";
import { decideProxy } from "@/lib/auth/proxy-gate";

export function proxy(request: NextRequest) {
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  const payload =
    (access ? decodeJwtPayload(access) : null) ??
    (refresh ? decodeJwtPayload(refresh) : null);
  const role =
    payload?.role === "CLIENT" || payload?.role === "TRAINER"
      ? payload.role
      : undefined;
  const decision = decideProxy(request.nextUrl.pathname, {
    hasSession: Boolean(access || refresh),
    role,
  });
  if (decision) {
    return NextResponse.redirect(new URL(decision.redirect, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/register", "/app/:path*", "/studio/:path*"],
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd apps/web && npm test -- --testPathPattern=proxy-gate.test.ts`

Expected: PASS. Then `cd apps/web && npm test`.

- [ ] **Step 5: Commit**

```bash
git add apps/web/lib/auth/proxy-gate.ts apps/web/lib/auth/proxy-gate.test.ts apps/web/proxy.ts
git commit -m "$(cat <<'EOF'
feat(web): gate /app and /studio by role in proxy.ts

EOF
)"
```

---

### Task 7: Páginas `/login` e `/register`

**Files:**

- Create: `apps/web/app/login/login-form.tsx`
- Create: `apps/web/app/login/page.tsx`
- Test: `apps/web/app/login/page.test.tsx`
- Create: `apps/web/app/register/register-form.tsx`
- Create: `apps/web/app/register/page.tsx`
- Test: `apps/web/app/register/page.test.tsx`
- Modify: `apps/web/app/page.tsx`
- Modify: `apps/web/app/page.test.tsx`
- Modify: `apps/web/app/layout.tsx` metadata title/description to `Zenith`

**Interfaces:**

- Consumes: BFF `POST /api/v1/auth/login` and `POST /api/v1/auth/register` (Task 4)
- Produces: login fields `email`, `password`; register fields `name`, `email`, `password`, radios `role=CLIENT` and `role=TRAINER` with **no default**
- Produces: on success `CLIENT` → `/app`, `TRAINER` → `/studio` via `useRouter().push`
- Produces: form error from JSON `message` (string or `string[]` joined)

- [ ] **Step 1: Write the failing tests**

`apps/web/app/login/page.test.tsx`:

```ts
import { render, screen } from "@testing-library/react";
import LoginPage from "./page";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe("LoginPage", () => {
  it("renders email, password and submit", () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
  });
});
```

`apps/web/app/register/page.test.tsx`:

```ts
import { render, screen } from "@testing-library/react";
import RegisterPage from "./page";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe("RegisterPage", () => {
  it("renders required fields including role choice without default", () => {
    render(<RegisterPage />);
    expect(screen.getByLabelText(/nome/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    const client = screen.getByRole("radio", { name: /aluno/i });
    const trainer = screen.getByRole("radio", { name: /treinador/i });
    expect(client).not.toBeChecked();
    expect(trainer).not.toBeChecked();
    expect(screen.getByRole("button", { name: /cadastrar/i })).toBeInTheDocument();
  });
});
```

Replace `apps/web/app/page.test.tsx`:

```ts
import { render, screen } from "@testing-library/react";
import Home from "./page";

describe("Home", () => {
  it("renderiza fallback de redirecionamento", () => {
    render(<Home />);
    expect(screen.getByText(/redirecionando/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/web && npm test -- --testPathPattern='login/page|register/page|app/page.test'`

Expected: FAIL — missing `./page` for login/register; home still looks for the old heading.

- [ ] **Step 3: Write minimal implementation**

`apps/web/app/login/login-form.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      role?: string;
      message?: string | string[];
    };
    setPending(false);
    if (!res.ok) {
      const message = Array.isArray(data.message)
        ? data.message.join(" ")
        : (data.message ?? "Não foi possível entrar");
      setError(message);
      return;
    }
    router.push(data.role === "TRAINER" ? "/studio" : "/app");
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        E-mail
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded border px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Senha
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="current-password"
          className="rounded border px-3 py-2"
        />
      </label>
      {error ? <p role="alert">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-foreground px-4 py-2 text-background"
      >
        Entrar
      </button>
    </form>
  );
}
```

`apps/web/app/login/page.tsx`:

```tsx
import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold">Entrar no Zenith</h1>
      <LoginForm />
      <p className="text-sm">
        Não tem conta? <Link href="/register">Cadastrar</Link>
      </p>
    </main>
  );
}
```

`apps/web/app/register/register-form.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/v1/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
        role: form.get("role"),
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      role?: string;
      message?: string | string[];
    };
    setPending(false);
    if (!res.ok) {
      const message = Array.isArray(data.message)
        ? data.message.join(" ")
        : (data.message ?? "Não foi possível cadastrar");
      setError(message);
      return;
    }
    router.push(data.role === "TRAINER" ? "/studio" : "/app");
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Nome
        <input name="name" required minLength={2} className="rounded border px-3 py-2" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        E-mail
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded border px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Senha
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="rounded border px-3 py-2"
        />
      </label>
      <fieldset className="flex flex-col gap-2">
        <legend>Papel</legend>
        <label>
          <input type="radio" name="role" value="CLIENT" required /> Aluno
        </label>
        <label>
          <input type="radio" name="role" value="TRAINER" required /> Treinador
        </label>
      </fieldset>
      {error ? <p role="alert">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-foreground px-4 py-2 text-background"
      >
        Cadastrar
      </button>
    </form>
  );
}
```

`apps/web/app/register/page.tsx`:

```tsx
import Link from "next/link";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold">Criar conta</h1>
      <RegisterForm />
      <p className="text-sm">
        Já tem conta? <Link href="/login">Entrar</Link>
      </p>
    </main>
  );
}
```

Replace `apps/web/app/page.tsx`:

```tsx
export default function Home() {
  return <p className="p-8">Redirecionando…</p>;
}
```

Replace metadata in `apps/web/app/layout.tsx` (keep fonts/body unchanged):

```tsx
export const metadata: Metadata = {
  title: "Zenith",
  description: "Tracker calórico para treinos híbridos",
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/web && npm test -- --testPathPattern='login/page|register/page|app/page.test'`

Expected: PASS. Then `cd apps/web && npm test` and `cd apps/web && npm run lint`.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/login apps/web/app/register apps/web/app/page.tsx apps/web/app/page.test.tsx apps/web/app/layout.tsx
git commit -m "$(cat <<'EOF'
feat(web): add login and register pages with role choice

EOF
)"
```

---

### Task 8: Placeholders `/app` e `/studio` + logout

**Files:**

- Create: `apps/web/components/auth/user-session.tsx`
- Create: `apps/web/app/app/page.tsx`
- Test: `apps/web/app/app/page.test.tsx`
- Create: `apps/web/app/studio/page.tsx`
- Test: `apps/web/app/studio/page.test.tsx`

**Interfaces:**

- Consumes: `GET /api/v1/auth/me` and `POST /api/v1/auth/logout` (Task 5)
- Produces: `/app` heading `Área do aluno`; `/studio` heading `Área do treinador`
- Produces: `UserSession` client component fetches `/api/v1/auth/me`, shows `name`, button `Sair` that POSTs logout then `router.push('/login')`

- [ ] **Step 1: Write the failing tests**

`apps/web/app/app/page.test.tsx`:

```ts
import { render, screen } from "@testing-library/react";
import AppHome from "./page";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe("App home", () => {
  beforeEach(() => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "1",
          name: "Ana",
          email: "ana@zenith.test",
          role: "CLIENT",
          createdAt: "2026-01-15T12:00:00.000Z",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders the student area heading", () => {
    render(<AppHome />);
    expect(
      screen.getByRole("heading", { name: /área do aluno/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sair/i })).toBeInTheDocument();
  });
});
```

`apps/web/app/studio/page.test.tsx`:

```ts
import { render, screen } from "@testing-library/react";
import StudioHome from "./page";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

describe("Studio home", () => {
  beforeEach(() => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "2",
          name: "Bia",
          email: "bia@zenith.test",
          role: "TRAINER",
          createdAt: "2026-01-15T12:00:00.000Z",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders the trainer area heading", () => {
    render(<StudioHome />);
    expect(
      screen.getByRole("heading", { name: /área do treinador/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sair/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd apps/web && npm test -- --testPathPattern='app/app/page|studio/page'`

Expected: FAIL — missing `./page`.

- [ ] **Step 3: Write minimal implementation**

`apps/web/components/auth/user-session.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function UserSession() {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/v1/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((user: { name?: string } | null) => {
        if (user?.name) setName(user.name);
      });
  }, []);

  async function logout() {
    await fetch("/api/v1/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="flex items-center gap-4">
      {name ? <p>Olá, {name}</p> : null}
      <button type="button" onClick={() => void logout()}>
        Sair
      </button>
    </div>
  );
}
```

`apps/web/app/app/page.tsx`:

```tsx
import { UserSession } from "@/components/auth/user-session";

export default function AppHome() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold">Área do aluno</h1>
      <UserSession />
    </main>
  );
}
```

`apps/web/app/studio/page.tsx`:

```tsx
import { UserSession } from "@/components/auth/user-session";

export default function StudioHome() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold">Área do treinador</h1>
      <UserSession />
    </main>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd apps/web && npm test`

Expected: all web tests PASS. `cd apps/web && npm run lint` PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/auth/user-session.tsx apps/web/app/app apps/web/app/studio
git commit -m "$(cat <<'EOF'
feat(web): add role home placeholders and logout

EOF
)"
```

---

### Task 9: PRD, SDD, migrate, CI

**Files:**

- Modify: `docs/prd.md`
- Modify: `docs/sdd.md`
- Modify: `.github/workflows/ci.yml`
- Modify: `apps/api/package.json` (script `prisma:migrate`)

**Interfaces:** none (docs + CI). Prisma migrate is required so local Postgres matches `User`.

- [ ] **Step 1: Update PRD**

In `docs/prd.md`, insert before `### 3.1 Histórias do aluno`:

```markdown
### 3.0 Histórias de sistema

**US-AS0 — Autenticação e modelo de usuário**  
Como visitante, eu quero me cadastrar e entrar com e-mail e senha escolhendo o papel (`CLIENT` ou `TRAINER`), para acessar só a interface do meu papel (`/app` ou `/studio`) com sessão em cookie `httpOnly`.
```

- [ ] **Step 2: Update SDD**

In `docs/sdd.md` architecture table, replace the Auth row and add:

| Auth | JWT access (~15m) + refresh (~7d); BFF Next (`app/api/v1/auth/*`); cookies `httpOnly` `zenith_access` / `zenith_refresh` |
| Gate web | `proxy.ts` (Next.js 16) em `/`, `/login`, `/register`, `/app`, `/studio` |

Replace the mermaid flowchart with:

```mermaid
flowchart LR
  Browser -->|"same-origin :3000"| Next["apps/web BFF + /app + /studio"]
  Next -->|"server fetch"| Nest["apps/api NestJS /api/v1"]
  Nest --> PG[(PostgreSQL)]
```

Add a note under the chart: o browser não chama `:3001`. `proxy.ts` lê o payload JWT sem verificar assinatura; o Nest `JwtAuthGuard` autoriza `/auth/me`.

Replace DTOs section with the spec contracts: `RegisterUserDto`, `LoginDto`, `RefreshTokenDto`, `AuthSessionResponseDto`, `UserResponseDto` (no `AuthTokenResponseDto` only-access). Document endpoints:

- Nest: `POST /api/v1/auth/register|login|refresh|logout`, `GET /api/v1/auth/me`
- Web BFF: same paths on `:3000`; JSON never includes tokens

- [ ] **Step 3: CI env + prisma generate**

`apps/api` already has `postinstall: prisma generate` (Task 1). Add to `.github/workflows/ci.yml` on the **api** job:

```yaml
    env:
      DATABASE_URL: postgresql://zenith:zenith@localhost:5432/zenith?schema=public
      JWT_ACCESS_SECRET: test-access-secret-at-least-32-chars!!
      JWT_REFRESH_SECRET: test-refresh-secret-at-least-32-chars!
      JWT_ACCESS_EXPIRES_IN: 15m
      JWT_REFRESH_EXPIRES_IN: 7d
```

On the **web** job:

```yaml
    env:
      API_URL: http://localhost:3001
```

Add script in `apps/api/package.json`: `"prisma:migrate": "prisma migrate dev --name init-user"`.

With Docker Postgres up (`docker compose up -d` from repo root), run:

```bash
cd apps/api && npx prisma migrate dev --name init-user
```

Expected: migration SQL created under `apps/api/prisma/migrations/` and applied.

- [ ] **Step 4: Verify tests still pass**

Run:

```bash
cd apps/api && npm test && npm run lint:check
cd apps/web && npm test && npm run lint
```

Expected: PASS on both.

- [ ] **Step 5: Commit**

```bash
git add docs/prd.md docs/sdd.md .github/workflows/ci.yml apps/api/package.json apps/api/prisma/migrations
git commit -m "$(cat <<'EOF'
docs: record US-AS0 auth BFF and Prisma User migration

EOF
)"
```

---

## Self-review (spec coverage)

| Spec | Task |
| --- | --- |
| Prisma `User` + bcrypt cost 10 | 1, 2 |
| Nest register/login/refresh/me/logout + validation 400/409/401 | 2, 3 |
| JWT `type` access vs refresh | 2, 3 |
| BFF cookies httpOnly, no tokens in JSON | 4 |
| BFF 401 without session cookies | 4 |
| Silent `/me` refresh once | 5 |
| Logout always clears cookies | 5 |
| `proxy.ts` role gate | 6 |
| `/login` `/register` role required no default | 7 |
| `/app` `/studio` + logout | 8 |
| PRD US-AS0 + SDD BFF/cookies/proxy | 9 |
| `.env.example` JWT + `API_URL` | 1, 4, 9 |
| CI lint+test | 9 (env); tests in 1–8 |

Fora de escopo (não implementar): denylist, CSRF extra, OAuth, convite, Playwright.
