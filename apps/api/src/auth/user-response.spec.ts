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
