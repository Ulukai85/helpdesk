import { describe, test, expect, mock, beforeEach } from 'bun:test';

const mockFindUnique = mock();

mock.module('./prisma', () => ({
  prisma: {
    user: { findUnique: mockFindUnique },
  },
}));

const { blockDeletedUsers } = await import('./auth-hooks');

const session = { userId: 'user-1' };

beforeEach(() => {
  mockFindUnique.mockReset();
});

describe('blockDeletedUsers', () => {
  test('returns the session when the user is active', async () => {
    mockFindUnique.mockResolvedValue({ deletedAt: null });

    const result = await blockDeletedUsers(session);

    expect(result).toEqual({ data: session });
  });

  test('returns the session when the user is not found', async () => {
    mockFindUnique.mockResolvedValue(null);

    const result = await blockDeletedUsers(session);

    expect(result).toEqual({ data: session });
  });

  test('throws when the user is soft-deleted', async () => {
    mockFindUnique.mockResolvedValue({ deletedAt: new Date() });

    await expect(blockDeletedUsers(session)).rejects.toThrow(
      'Your account has been deleted.',
    );
  });

  test('queries by session.userId with only the deletedAt field selected', async () => {
    mockFindUnique.mockResolvedValue({ deletedAt: null });

    await blockDeletedUsers(session);

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: { deletedAt: true },
    });
  });
});
