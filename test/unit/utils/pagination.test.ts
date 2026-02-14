import { parsePaginationParams, createPaginationResult } from '../../../src/utils/pagination.js';

describe('Pagination Utils', () => {
  describe('parsePaginationParams', () => {
    it('should use defaults when no params provided', () => {
      const result = parsePaginationParams();
      expect(result).toEqual({ limit: 20, skip: 0 });
    });

    it('should parse valid params', () => {
      const result = parsePaginationParams('10', '5');
      expect(result).toEqual({ limit: 10, skip: 5 });
    });

    it('should cap limit at max', () => {
      const result = parsePaginationParams('200', '0');
      expect(result.limit).toBe(100);
    });

    it('should ensure non-negative skip', () => {
      const result = parsePaginationParams('10', '-5');
      expect(result.skip).toBe(0);
    });
  });

  describe('createPaginationResult', () => {
    it('should create pagination result', () => {
      const data = [1, 2, 3];
      const result = createPaginationResult(data, 10, 3, 0);
      expect(result).toEqual({ data, count: 3, total: 10, hasMore: true });
    });

    it('should set hasMore false when no more data', () => {
      const data = [1, 2];
      const result = createPaginationResult(data, 2, 10, 0);
      expect(result.hasMore).toBe(false);
    });
  });
});
