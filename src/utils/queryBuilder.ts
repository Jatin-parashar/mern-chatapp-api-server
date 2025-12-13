import { Model, FilterQuery } from "mongoose";
import { parsePaginationParams, createPaginationResult } from "./pagination.js";

interface QueryOptions<T> {
  filter?: FilterQuery<T>;
  populate?: any;
  sort?: any;
  lean?: boolean;
}

export const buildPaginatedQuery = async (
  model: any,
  queryParams: { limit?: string; skip?: string },
  options: any = {}
) => {
  const { limit, skip } = parsePaginationParams(queryParams.limit, queryParams.skip);
  const { filter = {}, populate, sort, lean = false } = options;

  let query = model.find(filter);
  
  if (populate) query = query.populate(populate);
  if (sort) query = query.sort(sort);
  if (lean) query = query.lean();
  
  query = query.limit(limit).skip(skip);

  const [data, total] = await Promise.all([
    query.exec(),
    model.countDocuments(filter)
  ]);

  return createPaginationResult(data, total, limit, skip);
};