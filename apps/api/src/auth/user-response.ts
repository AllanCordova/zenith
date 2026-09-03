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
