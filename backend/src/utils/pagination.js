import { QueryValidationError } from "./errors.js";

const integerQuery = (value, fallback, name) => {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || !/^-?\d+$/.test(value) || !Number.isSafeInteger(Number(value))) {
    throw new QueryValidationError(`${name} must be a safe integer`);
  }
  return Number(value);
};

export const parsePagination = (
  query = {},
  { defaultLimit = 20, maxLimit = 100 } = {},
) => {
  const rawLimit = integerQuery(query.limit, defaultLimit, "limit");
  const rawPage = integerQuery(query.page, 1, "page");
  const limit = Math.max(
    1,
    Math.min(rawLimit, maxLimit),
  );
  const page = Math.max(1, rawPage);
  if (page > 1000000) {
    throw new QueryValidationError("page must not exceed 1000000");
  }
  const skip = (page - 1) * limit;
  return { limit, page, skip };
};

export const paginationMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit) || 1,
});
