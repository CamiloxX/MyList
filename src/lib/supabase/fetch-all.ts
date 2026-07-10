const PAGE_SIZE = 1000;

/**
 * Drains a PostgREST query past the default ~1000-row response cap by paging
 * with .range(). The caller provides a page fetcher and MUST apply a stable
 * .order() inside it, or pages can overlap/skip rows.
 */
export async function fetchAllRows<T>(
  fetchPage: (
    from: number,
    to: number,
  ) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await fetchPage(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    const page = data ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}
