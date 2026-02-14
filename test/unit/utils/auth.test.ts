import { hashPassword, verifyPassword, createAccessToken, createRefreshToken, validateAccessToken, validateRefreshToken } from '../../../src/utils/auth.js';
import { UserPayload } from '../../../src/types/user.js';

describe('Auth Utils', () => {
  describe('Password Hashing', () => {
    it('should hash password correctly', async () => {
      const password = 'testPassword123';
      const hashed = await hashPassword(password);
      
      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(hashed.length).toBeGreaterThan(0);
    });

    it('should compare password correctly', async () => {
      const password = 'testPassword123';
      const hashed = await hashPassword(password);
      
      const isMatch = await verifyPassword(password, hashed);
      expect(isMatch).toBe(true);
    });

    it('should fail for wrong password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword';
      const hashed = await hashPassword(password);
      
      const isMatch = await verifyPassword(wrongPassword, hashed);
      expect(isMatch).toBe(false);
    });
  });

  describe('JWT Tokens', () => {
    const userPayload: UserPayload = {
      _id: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
    };

    it('should generate access token', () => {
      const token = createAccessToken(userPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should generate refresh token', () => {
      const token = createRefreshToken(userPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should validate access token correctly', () => {
      const token = createAccessToken(userPayload);
      const decoded = validateAccessToken(token) as any;
      
      expect(decoded).toBeDefined();
      expect(decoded._id).toBe(userPayload._id);
    });

    it('should validate refresh token correctly', () => {
      const token = createRefreshToken(userPayload);
      const decoded = validateRefreshToken(token) as any;
      
      expect(decoded).toBeDefined();
      expect(decoded._id).toBe(userPayload._id);
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => validateAccessToken(invalidToken)).toThrow();
    });
  });
});
