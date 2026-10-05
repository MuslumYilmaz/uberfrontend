export function loadSitemapDateMap(
  baseUrl: string,
  fetchText: (url: string) => Promise<string>,
  canonicalBase?: string,
): Promise<Map<string, string>>;

export function schemaDateMatchesSitemap(
  schema: Record<string, unknown> | undefined,
  route: string,
  dates: ReadonlyMap<string, string>,
): boolean;
