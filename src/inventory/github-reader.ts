export type ConnectorRequest = Readonly<{ owner: string; page_size: number; page_offset: number; include_search_index_status: false }>;
export type ConnectorCall = (request: ConnectorRequest, signal: AbortSignal) => Promise<unknown>;
export type InventoryRequest = Readonly<{ owner: string; offset: number; limit: number }>;
const ownerPattern = /^[a-z0-9][a-z0-9-]{0,38}$/i;
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid connector response');
  return value as Record<string, unknown>;
}

// Adapts the existing owner-filtered connector, without credentials or new network clients.
// A non-cooperative connector can outlive cancellation; discard its late response.
export function createGitHubReader(owner: string, call: ConnectorCall) {
  if (!ownerPattern.test(owner)) throw new Error('invalid owner');
  return async (request: InventoryRequest, signal: AbortSignal) => {
    const { offset, limit } = request;
    if (request.owner !== owner || !Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100 || offset % limit !== 0 || offset >= limit * 100) throw new Error('invalid scoped request');
    if (signal.aborted) throw new Error('cancelled');
    let raw: unknown;
    try { raw = await call({ owner, page_size: limit, page_offset: offset, include_search_index_status: false }, signal); }
    catch { throw new Error('connector unavailable'); }
    if (signal.aborted) throw new Error('cancelled');
    const rows = record(record(raw).result).repositories;
    if (!Array.isArray(rows) || rows.length > limit) throw new Error('invalid connector response');
    const repositories = rows.map(value => {
      const row = record(value);
      const login = record(row.owner).login;
      const id = typeof row.id === 'number' && Number.isSafeInteger(row.id) && row.id > 0 ? String(row.id) : row.id;
      if (typeof login !== 'string' || login.toLowerCase() !== owner.toLowerCase() || typeof id !== 'string' || !/^[1-9]\d{0,39}$/.test(id) || typeof row.archived !== 'boolean' || (row.visibility !== 'public' && row.visibility !== 'private' && row.visibility !== 'internal')) throw new Error('invalid scoped repository');
      return { id, owner: { login: owner }, visibility: row.visibility, archived: row.archived };
    });
    return { repositories };
  };
}
