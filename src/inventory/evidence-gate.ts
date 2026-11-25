import { summarizeDecisions, type DecisionSummary, type Repository, type Review } from './decisions.ts';
export type InventoryPage = Readonly<{ offset: number; repositories: readonly Repository[] }>;
export type ResolveReceipt = (handle: string) => unknown;
export type GateSummary = DecisionSummary & { enumerationComplete: boolean; unresolved: number };

// Resolver is a trusted, local, synchronous lookup boundary, not a proof of authenticity.
// Only counts escape this function. Missing/mismatched receipts become unknown reviews.
export function gateDecisions(owner: string, pages: readonly InventoryPage[], pageSize: number, reviews: readonly Review[], resolve: ResolveReceipt): GateSummary {
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100 || pages.length > 100) throw new Error('invalid page budget');
  const repos: Repository[] = [];
  let complete = false;
  let short = false;
  for (const [index, page] of pages.entries()) {
    if (complete || page.offset !== index * pageSize || page.repositories.length > pageSize || (short && page.repositories.length !== 0)) throw new Error('invalid pagination');
    complete = page.repositories.length === 0;
    short = page.repositories.length < pageSize;
    repos.push(...page.repositories);
  }
  // Validate every observation/review before invoking the external resolver.
  summarizeDecisions(owner, repos, reviews, complete);
  let unresolved = 0;
  const checked: Review[] = reviews.map(review => {
    if (review.decision === 'unknown') return { id: review.id, decision: 'unknown' };
    try {
      const value = resolve(review.evidence!);
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const r = value as Record<string, unknown>;
        if (r.handle === review.evidence && r.owner === owner && r.repositoryId === review.id && r.decision === review.decision && r.state === 'verified') return { ...review };
      }
    } catch { /* never disclose resolver errors */ }
    unresolved++;
    return { id: review.id, decision: 'unknown' };
  });
  return { ...summarizeDecisions(owner, repos, checked, complete), enumerationComplete: complete, unresolved };
}
