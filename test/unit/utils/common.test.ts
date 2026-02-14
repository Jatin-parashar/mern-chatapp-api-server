import { isValidObjectId, toString, generateCallId, formatUserForSocket, arrayIncludesUserId, safeJsonParse, uniqueByKey } from '../../../src/utils/common.js';

describe('Common Utils', () => {
  describe('isValidObjectId', () => {
    it('should validate correct ObjectId', () => {
      expect(isValidObjectId('507f1f77bcf86cd799439011')).toBe(true);
    });

    it('should reject invalid ObjectId', () => {
      expect(isValidObjectId('invalid')).toBe(false);
    });
  });

  describe('toString', () => {
    it('should convert value to string', () => {
      expect(toString(123)).toBe('123');
      expect(toString({ toString: () => 'obj' })).toBe('obj');
    });
  });

  describe('generateCallId', () => {
    it('should generate unique call id', () => {
      const id1 = generateCallId();
      const id2 = generateCallId();
      expect(id1).toMatch(/^call_/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('formatUserForSocket', () => {
    it('should format user object', () => {
      const user = { _id: 'u1', name: 'Test', username: 'test', extra: 'data' };
      const result = formatUserForSocket(user);
      expect(result).toEqual({ _id: 'u1', name: 'Test', username: 'test', profilePic: undefined, status: undefined });
    });

    it('should return null for null user', () => {
      expect(formatUserForSocket(null)).toBe(null);
    });
  });

  describe('arrayIncludesUserId', () => {
    it('should find userId in array', () => {
      expect(arrayIncludesUserId(['u1', 'u2'], 'u1')).toBe(true);
    });

    it('should return false if not found', () => {
      expect(arrayIncludesUserId(['u1', 'u2'], 'u3')).toBe(false);
    });
  });

  describe('safeJsonParse', () => {
    it('should parse valid JSON', () => {
      expect(safeJsonParse('{"a":1}')).toEqual({ a: 1 });
    });

    it('should return fallback for invalid JSON', () => {
      expect(safeJsonParse('invalid', null)).toBe(null);
    });
  });

  describe('uniqueByKey', () => {
    it('should remove duplicates by key', () => {
      const arr = [{ id: 1 }, { id: 2 }, { id: 1 }];
      const result = uniqueByKey(arr, 'id');
      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    });
  });
});
