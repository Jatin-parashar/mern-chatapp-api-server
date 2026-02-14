export interface PaginationParams {
  limit: number;
  skip: number;
}

export interface PaginationResult<T> {
  data: T[];
  count: number;
  total: number;
  hasMore: boolean;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export const parsePaginationParams = (
  limit?: string,
  skip?: string
): PaginationParams => {
  const parsedLimit = parseInt(limit || '') || DEFAULT_LIMIT;
  const parsedSkip = parseInt(skip || '') || 0;

  return {
    limit: Math.min(parsedLimit, MAX_LIMIT), // Cap at max limit
    skip: Math.max(parsedSkip, 0), // Ensure non-negative
  };
};

export const createPaginationResult = <T>(
  data: T[],
  total: number,
  _limit: number,
  skip: number
): PaginationResult<T> => {
  return {
    data,
    count: data.length,
    total,
    hasMore: skip + data.length < total,
  };
};