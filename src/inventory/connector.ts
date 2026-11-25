import { normalizePage, type PageReader } from './collect.ts';

export type RepositoryList = (args: Readonly<{owner: string; page_size: number; page_offset: number}>, signal: AbortSignal) => Promise<unknown>;
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid connector record');
  return value as Record<string, unknown>;
}
// Only the normalized connector envelope is supported. No implicit defaults for missing archive or owner fields.
export function connectorReader(owner: string, list: RepositoryList): PageReader {
  if (typeof owner !== 'string' || !/^[a-z\d][a-z\d-]{0,38}$/i.test(owner)) throw new Error('invalid owner');
  return async (request, signal) => {
    if (request.owner !== owner || !Number.isInteger(request.limit) || request.limit < 1 || request.limit > 100 || !Number.isSafeInteger(request.offset) || request.offset < 0 || signal.aborted) throw new Error('invalid connector request');
    const response = await list({owner,page_size:request.limit,page_offset:request.offset},signal);
    try {
      const raw = record(record(response).result);
      const page = normalizePage(raw,request.offset,request.limit);
      const rows = raw.repositories as unknown[];
      const repositories = page.repos.map((repo,index) => {
        const row = record(rows[index]);
        if (repo.owner !== owner || record(row.owner).type !== 'User' || typeof row.archived !== 'boolean') throw new Error('invalid scope or archive');
        return {id:repo.id,owner:{login:repo.owner},visibility:repo.visibility,archived:row.archived};
      });
      return {repositories};
    } catch { return null; } // invalid_page, not an empty page or transport success
  };
}
