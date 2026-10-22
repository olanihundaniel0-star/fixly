export const parsePagination = (
  query = {},
  { defaultLimit = 20, maxLimit = 100 } = {},
) => {
  const rawLimit = parseInt(query.limit, 10);
  const rawPage = parseInt(query.page, 10);
  const limit = Math.max(
    1,
    Math.min(Number.isNaN(rawLimit) ? defaultLimit : rawLimit, maxLimit),
  );
  const page = Math.max(1, Number.isNaN(rawPage) ? 1 : rawPage);
  const skip = (page - 1) * limit;
  return { limit, page, skip };
};

export const paginationMeta = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit) || 1,
});
