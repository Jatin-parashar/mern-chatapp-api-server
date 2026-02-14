import { jest } from '@jest/globals';

// Mock modules before imports
const mockAuthCredentialFindOne = jest.fn<any>();
const mockAuthCredentialCreate = jest.fn<any>();
const mockUserFindOne = jest.fn<any>();
const mockUserCreate = jest.fn<any>();
const mockHashPassword = jest.fn<any>();
const mockVerifyPassword = jest.fn<any>();

jest.unstable_mockModule('../../../src/models/auth.model.js', () => ({
  default: {
    findOne: mockAuthCredentialFindOne,
    create: mockAuthCredentialCreate
  }
}));

jest.unstable_mockModule('../../../src/models/user.model.js', () => ({
  default: {
    findOne: mockUserFindOne,
    create: mockUserCreate
  }
}));

jest.unstable_mockModule('../../../src/utils/auth.js', () => ({
  hashPassword: mockHashPassword,
  verifyPassword: mockVerifyPassword
}));

const { createUser, loginUser } = await import('../../../src/services/auth.service.js');

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create new user', async () => {
      mockAuthCredentialFindOne.mockResolvedValue(null);
      mockUserFindOne.mockResolvedValue(null);
      mockHashPassword.mockResolvedValue('hashed');
      mockAuthCredentialCreate.mockResolvedValue({ _id: 'u1', email: 'test@test.com' });
      mockUserCreate.mockResolvedValue({});

      const result = await createUser('Test', 'test@test.com', 'testuser', 'pass123');
      expect(result).toEqual({ _id: 'u1', email: 'test@test.com' });
    });

    it('should throw if email exists', async () => {
      mockAuthCredentialFindOne.mockResolvedValue({ email: 'test@test.com' });
      await expect(createUser('Test', 'test@test.com', 'testuser', 'pass123')).rejects.toThrow();
    });
  });

  describe('loginUser', () => {
    it('should login user with valid credentials', async () => {
      const mockUser = { _id: 'u1', email: 'test@test.com', password: 'hashed' };
      mockAuthCredentialFindOne.mockResolvedValue(mockUser);
      mockVerifyPassword.mockResolvedValue(true);

      const result = await loginUser('test@test.com', 'pass123');
      expect(result).toEqual({ _id: 'u1', email: 'test@test.com' });
    });

    it('should throw with invalid credentials', async () => {
      mockAuthCredentialFindOne.mockResolvedValue(null);
      mockVerifyPassword.mockResolvedValue(false);
      await expect(loginUser('test@test.com', 'wrong')).rejects.toThrow();
    });
  });
});
