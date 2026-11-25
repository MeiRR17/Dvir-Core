export type Decision = 'adopt' | 'defer' | 'not_applicable' | 'unknown';
export type Repository = Readonly<{ id: string; owner: string; archived: boolean }>;
export type Review = Readonly<{ id: string; decision: Decision; evidence?: string }>;
export type DecisionSummary = { repositories: number; archived: number; active: number; adopt: number; defer: number; not_applicable: number; unknown: number; complete: boolean };
const validId = (id: unknown): id is string => typeof id === 'string' && /^[1-9]\d*$/.test(id);
const decisions = ['adopt', 'defer', 'not_applicable', 'unknown'] as const;
// Only aggregate counts leave this function; evidence handles and IDs remain with the caller.
export function summarizeDecisions(owner: string, repos: readonly Repository[], reviews: readonly Review[], enumerationComplete: boolean): DecisionSummary {
  if (!/^[a-z\d][a-z\d-]{0,38}$/i.test(owner) || typeof enumerationComplete !== 'boolean') throw new Error('invalid configuration');
  const ids = new Set<string>();
  let archived = 0;
  for (const repo of repos) {
    if (!validId(repo.id) || repo.owner !== owner || typeof repo.archived !== 'boolean' || ids.has(repo.id)) throw new Error('invalid repository observation');
    ids.add(repo.id);
    if (repo.archived) archived++;
  }
  const seen = new Set<string>();
  const counts = { adopt: 0, defer: 0, not_applicable: 0, unknown: repos.length };
  for (const review of reviews) {
    if (!ids.has(review.id) || seen.has(review.id) || !decisions.includes(review.decision)) throw new Error('invalid review');
    seen.add(review.id);
    if (review.decision === 'unknown') continue;
    if (typeof review.evidence !== 'string' || !/^receipt:[a-zA-Z0-9_-]{1,80}$/.test(review.evidence)) throw new Error('missing evidence handle');
    counts.unknown--;
    counts[review.decision]++;
  }
  return { repositories: repos.length, archived, active: repos.length - archived, ...counts, complete: enumerationComplete && counts.unknown === 0 };
}
