import { summarizeInventory, type Page, type Repo, type Coverage } from './coverage.ts';
export type PageRequest = { owner: string; offset: number; limit: number };
export type PageResponse = { kind: 'ok'; repos: unknown } | { kind: 'rate_limit' | 'denied' | 'unavailable' };
export type Transport = (request: PageRequest) => Promise<PageResponse>;
export type Stop = 'complete' | 'budget' | 'rate_limit' | 'denied' | 'unavailable' | 'invalid_page';
export type Result = Coverage & { stop: Stop };

// The injected transport must provide owner-scoped, stable offset pagination.
// Never retain raw provider records or error messages in the returned receipt.
export async function collectInventory(owner: string, fetchPage: Transport, pageSize = 100, maxPages = 20): Promise<Result> {
  if (!/^[a-z0-9][a-z0-9-]{0,38}$/i.test(owner) || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100 || !Number.isInteger(maxPages) || maxPages < 1 || maxPages > 100) throw new Error('invalid configuration');
  const pages: Page[] = [];
  let coverage = summarizeInventory(pages, owner, pageSize);
  const finish = (stop: Stop): Result => ({ ...coverage, stop });
  for (let i = 0; i < maxPages; i++) {
    const offset = i * pageSize;
    let response: PageResponse;
    try { response = await fetchPage({ owner, offset, limit: pageSize }); } catch { return finish('unavailable'); }
    if (!response || typeof response !== 'object') return finish('invalid_page');
    if (response.kind === 'rate_limit' || response.kind === 'denied' || response.kind === 'unavailable') return finish(response.kind);
    if (response.kind !== 'ok' || !Array.isArray(response.repos) || response.repos.length > pageSize) return finish('invalid_page');
    const repos: Repo[] = [];
    for (const raw of response.repos) {
      if (!raw || typeof raw !== 'object') return finish('invalid_page');
      const { id, owner: observedOwner, visibility } = raw as Record<string, unknown>;
      if (typeof id !== 'string' || typeof observedOwner !== 'string' || observedOwner.toLowerCase() !== owner.toLowerCase() || (visibility !== 'public' && visibility !== 'private' && visibility !== 'internal')) return finish('invalid_page');
      repos.push({ id, owner, visibility });
    }
    const page = { offset, repos };
    try { coverage = summarizeInventory([...pages, page], owner, pageSize); } catch { return finish('invalid_page'); }
    pages.push(page);
    if (coverage.complete) return finish('complete');
  }
  return finish('budget');
}
