export function buildPagination(page = 1, limit = 10) {
  const safePage = Math.max(page, 1);
  const safeLimit = Math.min(Math.max(limit, 1), 100);

  const take = safeLimit;
  const skip = (safePage - 1) * safeLimit;

  return { take, skip, page: safePage, limit: safeLimit };
}
