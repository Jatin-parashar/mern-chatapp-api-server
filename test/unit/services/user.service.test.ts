import { jest } from '@jest/globals';

// Mock modules before imports
const mockUserFindById = jest.fn<any>();
const mockUserFindByIdAndUpdate = jest.fn<any>();
const mockUserFindOne = jest.fn<any>();

jest.unstable_mockModule('../../../src/models/user.model.js', () => ({
  default: {
    findById: mockUserFindById,
    findByIdAndUpdate: mockUserFindByIdAndUpdate,
    findOne: mockUserFindOne
  }
}));

const { findUserById, updateUserStatus, checkUsernameAvailability } = await import('../../../src/services/user.service.js');

describe('User Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findUserById', () => {
    it('should find user by id', async () => {
      const mockUser = { _id: 'u1', name: 'Test' };
      mockUserFindById.mockResolvedValue(mockUser);

      const result = await findUserById('u1');
      expect(result).toEqual(mockUser);
    });

    it('should throw if user not found', async () => {
      mockUserFindById.mockResolvedValue(null);
      await expect(findUserById('u1')).rejects.toThrow();
    });
  });

  describe('updateUserStatus', () => {
    it('should update user status', async () => {
      const mockUser = { _id: 'u1', status: 'online' };
      mockUserFindByIdAndUpdate.mockResolvedValue(mockUser);

      const result = await updateUserStatus('u1', 'online');
      expect(result.status).toBe('online');
    });

    it('should throw if user not found', async () => {
      mockUserFindByIdAndUpdate.mockResolvedValue(null);
      await expect(updateUserStatus('u1', 'online')).rejects.toThrow();
    });
  });

  describe('checkUsernameAvailability', () => {
    it('should return true if username available', async () => {
      mockUserFindOne.mockResolvedValue(null);
      const result = await checkUsernameAvailability('newuser');
      expect(result).toBe(true);
    });

    it('should return false if username taken', async () => {
      mockUserFindOne.mockResolvedValue({ username: 'taken' });
      const result = await checkUsernameAvailability('taken');
      expect(result).toBe(false);
    });
  });
});
