import { summarizeDecisions, type Repository, type Review, type DecisionSummary } from './decisions.ts';
import { normalizePage } from './collect.ts';
import { summarizeInventory, type Page } from './coverage.ts';

export type ReceiptReader = (handle: string) => unknown;
export type VerifiedSummary = { summary: DecisionSummary; unresolved: number };
const sha = /^[a-f0-9]{40}$/;
const handlePattern = /^receipt:[a-zA-Z0-9_-]{1,80}$/;
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid record');
  return value as Record<string, unknown>;
}
// The trusted caller supplies a private, read-only receipt reader and an explicit clock.
// Binding and freshness checks do not authenticate the upstream evidence itself.
export function reviewInventory(owner: string, pages: readonly unknown[], pageSize: number,
  reviews: readonly Review[], resolve: ReceiptReader, now: number, revision: string): VerifiedSummary {
  if (!Number.isSafeInteger(now) || now < 0 || !sha.test(revision) || pages.length > 100) throw new Error('invalid review configuration');
  const normalized: Page[] = [];
  const repos: Repository[] = [];
  for (const raw of pages) {
    const page = record(raw);
    if (typeof page.offset !== 'number') throw new Error('invalid offset');
    const parsed = normalizePage(page, page.offset, pageSize);
    const previous = normalized.at(-1);
    if (previous && previous.repos.length < pageSize && parsed.repos.length) throw new Error('nonempty after short page');
    const rows = page.repositories as unknown[];
    for (const [i, repo] of parsed.repos.entries()) {
      const archived = record(rows[i]).archived;
      if (typeof archived !== 'boolean') throw new Error('invalid archive observation');
      repos.push({ id: repo.id, owner: repo.owner, archived });
    }
    normalized.push(parsed);
  }
  const coverage = summarizeInventory(normalized, owner, pageSize);
  // Validate entire input before consulting the private reader.
  summarizeDecisions(owner, repos, reviews, coverage.complete);
  const verified: Review[] = [];
  let unresolved = 0;
  for (const review of reviews) {
    if (review.decision === 'unknown') continue;
    let valid = false;
    try {
      const handle = review.evidence!;
      if (!handlePattern.test(handle)) throw new Error('invalid handle');
      const receipt = record(resolve(handle));
      valid = receipt.handle === handle && receipt.owner === owner && receipt.repositoryId === review.id &&
        receipt.decision === review.decision && receipt.revision === revision &&
        typeof receipt.observedAt === 'number' && Number.isSafeInteger(receipt.observedAt) && receipt.observedAt >= 0 && receipt.observedAt <= now &&
        typeof receipt.expiresAt === 'number' && Number.isSafeInteger(receipt.expiresAt) && receipt.expiresAt > now;
    } catch { /* private lookup errors remain private */ }
    if (valid) verified.push(review); else unresolved++;
  }
  return { summary: summarizeDecisions(owner, repos, verified, coverage.complete), unresolved };
}
