import { jest } from '@jest/globals';

// Mock modules before imports
const mockCreateUser = jest.fn<any>();
const mockLoginUser = jest.fn<any>();
const mockCreateTokenPair = jest.fn<any>();
const mockValidateRefreshToken = jest.fn<any>();
const mockCreateAccessToken = jest.fn<any>();

jest.unstable_mockModule('../../../src/services/auth.service.js', () => ({
  createUser: mockCreateUser,
  loginUser: mockLoginUser
}));

jest.unstable_mockModule('../../../src/utils/authHelpers.js', () => ({
  createTokenPair: mockCreateTokenPair
}));

jest.unstable_mockModule('../../../src/utils/auth.js', () => ({
  validateRefreshToken: mockValidateRefreshToken,
  createAccessToken: mockCreateAccessToken
}));

const { register, login, logout, refreshToken } = await import('../../../src/controllers/auth.controller.js');

describe('Auth Controller', () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: any;

  beforeEach(() => {
    mockReq = { body: {}, file: null };
    mockRes = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register new user', async () => {
      mockReq.body = { name: 'Test', email: 'test@test.com', username: 'test', password: 'pass123' };
      mockCreateUser.mockResolvedValue({ _id: 'u1', email: 'test@test.com' });
      mockCreateTokenPair.mockReturnValue({ accessToken: 'at', refreshToken: 'rt' });

      await register(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe('login', () => {
    it('should login user', async () => {
      mockReq.body = { email: 'test@test.com', password: 'pass123' };
      mockLoginUser.mockResolvedValue({ _id: 'u1', email: 'test@test.com' });
      mockCreateTokenPair.mockReturnValue({ accessToken: 'at', refreshToken: 'rt' });

      await login(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('logout', () => {
    it('should logout user', () => {
      logout(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('refreshToken', () => {
    it('should refresh access token', async () => {
      mockReq.body = { refreshToken: 'rt' };
      mockValidateRefreshToken.mockReturnValue({ _id: 'u1', email: 'test@test.com' });
      mockCreateAccessToken.mockReturnValue('new_at');

      await refreshToken(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });
});
