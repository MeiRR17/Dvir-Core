export type Decision = 'adopt' | 'defer' | 'not_applicable' | 'unknown';
export type DecisionSummary = { total: number; adopt: number; defer: number; not_applicable: number; unknown: number; archived: number; archiveUnknown: number; reviewComplete: boolean };

// Private inputs remain in caller memory. Output contains aggregate counts only.
export function summarizeDecisions(owner: string, inventory: readonly unknown[], reviews: readonly unknown[]): DecisionSummary {
  if (!/^[a-z0-9][a-z0-9-]{0,38}$/i.test(owner)) throw new Error('invalid scope');
  const ids = new Map<string, boolean | null>();
  const decisions = new Map<string, Decision>();
  function object(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid record');
    return value as Record<string, unknown>;
  }
  function identity(row: Record<string, unknown>): string {
    if (typeof row.owner !== 'string' || row.owner.toLowerCase() !== owner.toLowerCase() || typeof row.id !== 'string' || !/^[1-9]\d*$/.test(row.id)) throw new Error('invalid scope or id');
    return row.id;
  }
  for (const value of inventory) {
    const row = object(value);
    const id = identity(row);
    if (ids.has(id) || (row.archived !== true && row.archived !== false && row.archived !== null)) throw new Error('invalid inventory');
    ids.set(id, row.archived);
  }
  for (const value of reviews) {
    const row = object(value);
    const id = identity(row);
    const decision = row.decision;
    if (!ids.has(id) || decisions.has(id) || (decision !== 'adopt' && decision !== 'defer' && decision !== 'not_applicable' && decision !== 'unknown')) throw new Error('invalid review');
    // Reviewed dispositions require an explicit evidence reference; never return it.
    if (decision !== 'unknown' && (typeof row.evidence !== 'string' || !row.evidence.trim() || row.evidence.length > 2048)) throw new Error('missing evidence');
    decisions.set(id, decision);
  }
  const result: DecisionSummary = { total: ids.size, adopt: 0, defer: 0, not_applicable: 0, unknown: 0, archived: 0, archiveUnknown: 0, reviewComplete: false };
  for (const [id, archived] of ids) {
    result[decisions.get(id) ?? 'unknown']++;
    if (archived === true) result.archived++;
    if (archived === null) result.archiveUnknown++;
  }
  result.reviewComplete = result.unknown === 0;
  return result;
}
