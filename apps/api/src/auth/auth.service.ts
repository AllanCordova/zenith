import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
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

function isPrismaUniqueConflict(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  );
}

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
    try {
      const user = await this.prisma.user.create({
        data: { email, name, passwordHash, role: input.role },
      });
      return this.issueSession(user);
    } catch (error) {
      if (isPrismaUniqueConflict(error)) {
        throw new ConflictException('Email already registered');
      }
      throw error;
    }
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
    return this.issueSession(user);
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
      accessToken: await this.sign(user, 'access'),
      refreshToken: await this.sign(user, 'refresh'),
    };
  }

  async me(userId: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }
    return toUserResponse(user);
  }

  logout(): Promise<void> {
    return Promise.resolve();
  }

  private async issueSession(
    user: UserRecord,
  ): Promise<AuthSessionResponseDto> {
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
      { secret, expiresIn: expiresIn as JwtSignOptions['expiresIn'] },
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
