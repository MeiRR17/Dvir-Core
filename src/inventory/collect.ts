import { summarizeInventory, type Coverage, type Page, type Repo } from './coverage.ts';
import { classifyReadError, readWithDeadline, type ReadFailure } from './deadline.ts';

type RecordValue = Record<string, unknown>;
function record(value: unknown): RecordValue {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('invalid record');
  return value as RecordValue;
}
export type PageReader = (request: Readonly<{ owner: string; offset: number; limit: number }>, signal: AbortSignal) => Promise<unknown>;
export type Collection = { coverage: Coverage; stop: 'complete' | 'page_limit' | 'invalid_page' | ReadFailure };

// Only the fields needed by the coverage reducer survive normalization.
export function normalizePage(value: unknown, offset: number, limit: number): Page {
  if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error('invalid page bounds');
  const rows = record(value).repositories;
  if (!Array.isArray(rows) || rows.length > limit) throw new Error('invalid page');
  const repos: Repo[] = rows.map(item => {
    const row = record(item);
    const id = typeof row.id === 'number' && Number.isSafeInteger(row.id) && row.id > 0 ? String(row.id) : row.id;
    const owner = record(row.owner).login;
    const visibility = row.visibility;
    if (typeof id !== 'string' || !/^[1-9]\d*$/.test(id) || typeof owner !== 'string' || !['public', 'private', 'internal'].includes(String(visibility)) || typeof visibility !== 'string') throw new Error('invalid repository');
    return { id, owner, visibility: visibility as Repo['visibility'] };
  });
  return { offset, repos };
}

// Fixed-width offsets; a short page must be followed by an explicit empty page.
// No retries, credentials or raw provider errors. Per-page deadline requests abort.
export async function collectInventory(reader: PageReader, owner: string, limit = 100, maxPages = 20, deadlineMs = 10_000): Promise<Collection> {
  if (typeof owner !== 'string' || !/^[a-z0-9][a-z0-9-]{0,38}$/i.test(owner)) throw new Error('invalid owner');
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error('invalid page size');
  if (!Number.isSafeInteger(deadlineMs) || deadlineMs < 1 || deadlineMs > 60_000) throw new Error('invalid deadline');
  if (!Number.isInteger(maxPages) || maxPages < 1 || maxPages > 100) throw new Error('invalid page budget');
  const pages: Page[] = [];
  let coverage = summarizeInventory(pages, owner, limit);
  for (let index = 0; index < maxPages; index++) {
    let raw: unknown;
    try { raw = await readWithDeadline(signal => reader({ owner, offset: index * limit, limit }, signal), deadlineMs); }
    catch (error) { return { coverage, stop: classifyReadError(error) }; }
    try {
      const page = normalizePage(raw, index * limit, limit);
      const previous = pages.at(-1);
      if (previous && previous.repos.length < limit && page.repos.length !== 0) throw new Error('nonempty after short page');
      // GitHub owner logins are case-insensitive. Normalize only the requested
      // owner's case; foreign owners remain foreign and fail closed in the reducer.
      const scoped = { offset: page.offset, repos: page.repos.map(repo => ({ ...repo, owner: repo.owner.toLowerCase() === owner.toLowerCase() ? owner : repo.owner })) };
      coverage = summarizeInventory([...pages, scoped], owner, limit);
      pages.push(scoped);
    } catch { return { coverage, stop: 'invalid_page' }; }
    if (coverage.complete) return { coverage, stop: 'complete' };
  }
  return { coverage, stop: 'page_limit' };
}
