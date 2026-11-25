export type Repo = { id: string; owner: string; visibility: 'public' | 'private' | 'internal' };
export type Page = { offset: number; repos: readonly Repo[] };
export type Coverage = { complete: boolean; count: number; publicCount: number; pageCount: number };

// Pure aggregation: no network, credentials, repository names or raw records in output.
export function summarizeInventory(pages: readonly Page[], owner: string, pageSize: number): Coverage {
  if (!owner.trim() || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) throw new Error('invalid configuration');
  const seen = new Set<string>();
  let publicCount = 0;
  let complete = false;
  for (const [index, page] of pages.entries()) {
    if (complete || page.offset !== index * pageSize || page.repos.length > pageSize) throw new Error('invalid pagination');
    if (page.repos.length === 0) complete = true;
    for (const repo of page.repos) {
      if (repo.owner !== owner || !repo.id.trim() || !['public', 'private', 'internal'].includes(repo.visibility)) throw new Error('invalid repository scope or record');
      if (seen.has(repo.id)) throw new Error('duplicate repository');
      seen.add(repo.id);
      if (repo.visibility === 'public') publicCount++;
    }
  }
  return { complete, count: seen.size, publicCount, pageCount: pages.length };
}
