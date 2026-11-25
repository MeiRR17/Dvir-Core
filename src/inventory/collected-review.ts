import { collectInventory, normalizePage, type Collection, type PageReader } from './collect.ts';
import { summarizeDecisions, type Review } from './decisions.ts';
import { reviewInventory, type ReceiptReader, type VerifiedSummary } from './review.ts';

type SafePage = { offset: number; repositories: { id: string; owner: {login: string}; visibility: 'public' | 'private' | 'internal'; archived: boolean }[] };
export type CollectedReview = { collection: Collection; review: VerifiedSummary; unobservedReviews: number };
export type ReviewOptions = Readonly<{ owner: string; pageSize: number; maxPages: number; deadlineMs: number; now: number; revision: string }>;

// Caller supplies an authorized read transport and private receipt reader. No raw provider records are retained.
export async function collectAndReview(reader: PageReader, reviews: readonly Review[], resolve: ReceiptReader, options: ReviewOptions): Promise<CollectedReview> {
  const {owner,pageSize,maxPages,deadlineMs,now,revision} = options;
  if (!Number.isSafeInteger(now) || now < 0 || typeof revision !== 'string' || !/^[a-f0-9]{40}$/.test(revision)) throw new Error('invalid review configuration');
  // Validate all proposed reviews before transport or receipt access, including unobserved IDs.
  summarizeDecisions(owner, reviews.map(r => ({id:r.id,owner,archived:false})), reviews, false);
  const candidates: SafePage[] = [];
  const collection = await collectInventory(async (request,signal) => {
    const raw = await reader(request,signal);
    try {
      const normalized = normalizePage(raw,request.offset,request.limit);
      const rows = (raw as {repositories: unknown[]}).repositories;
      const repositories = normalized.repos.map((repo,index) => {
        const archived = (rows[index] as {archived?: unknown}).archived;
        if (typeof archived !== 'boolean') throw new Error('invalid archive observation');
        return {id:repo.id,owner:{login:repo.owner},visibility:repo.visibility,archived};
      });
      const page = {offset:request.offset,repositories};
      // Ignore a late result after the collector's deadline.
      if (!signal.aborted) candidates.push(page);
      return page;
    } catch { return null; } // collector classifies malformed page without private detail
  },owner,pageSize,maxPages,deadlineMs);
  // Collector may reject the final candidate for scope, duplication or pagination.
  const accepted = candidates.slice(0,collection.coverage.pageCount);
  const observed = new Set(accepted.flatMap(p => p.repositories.map(r => r.id)));
  const included = reviews.filter(r => observed.has(r.id));
  const unobservedReviews = reviews.length - included.length;
  if (collection.coverage.complete && unobservedReviews) throw new Error('review outside complete inventory');
  const review = reviewInventory(owner,accepted,pageSize,included,resolve,now,revision);
  return {collection,review,unobservedReviews};
}
