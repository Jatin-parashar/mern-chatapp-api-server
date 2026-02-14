import { buildPaginatedQuery } from '../../../src/utils/queryBuilder.js';
import { jest } from '@jest/globals';

describe('Query Builder', () => {
  describe('buildPaginatedQuery', () => {
    it('should build paginated query with defaults', async () => {
      const mockModel = {
        find: jest.fn<any>().mockReturnThis(),
        sort: jest.fn<any>().mockReturnThis(),
        limit: jest.fn<any>().mockReturnThis(),
        skip: jest.fn<any>().mockReturnThis(),
        exec: jest.fn<any>().mockResolvedValue([]),
        countDocuments: jest.fn<any>().mockResolvedValue(0)
      };

      const result = await buildPaginatedQuery(mockModel, {});
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
    });
  });
});
