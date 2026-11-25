import { collectInventory, type Collection } from './collect.ts';
import { createGitHubReader, type ConnectorCall } from './github-reader.ts';
import { reviewInventory, type ReceiptReader, type VerifiedSummary } from './review.ts';
import type { Review } from './decisions.ts';
export type PipelineOptions = Readonly<{ owner: string; pageSize: number; maxPages: number; deadlineMs: number; now: number; revision: string }>;
export type PipelineResult = { collection: Collection; review: VerifiedSummary | null; status: 'incomplete_inventory' | 'review_error' | 'incomplete_review' | 'complete' };

// Keep minimized provider observations in memory only; never expose them in the result.
// No receipt lookups on incomplete collection; no network or filesystem writes here.
export async function runInventoryReview(options: PipelineOptions, call: ConnectorCall, reviews: readonly Review[], resolve: ReceiptReader): Promise<PipelineResult> {
  const { owner, pageSize, maxPages, deadlineMs, now, revision } = options;
  if (!Number.isSafeInteger(now) || now < 0 || !/^[a-f0-9]{40}$/.test(revision)) throw new Error('invalid review configuration');
  const reader = createGitHubReader(owner, call);
  const pages: unknown[] = [];
  const collection = await collectInventory(async (request, signal) => {
    const page = await reader(request, signal);
    if (!signal.aborted) pages.push({ offset: request.offset, ...page });
    return page;
  }, owner, pageSize, maxPages, deadlineMs);
  if (!collection.coverage.complete || collection.stop !== 'complete') return { collection, review: null, status: 'incomplete_inventory' };
  try {
    const review = reviewInventory(owner, pages, pageSize, reviews, resolve, now, revision);
    return { collection, review, status: review.summary.complete ? 'complete' : 'incomplete_review' };
  } catch { return { collection, review: null, status: 'review_error' }; }
}
