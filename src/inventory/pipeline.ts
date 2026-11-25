import type { Collection } from './collect.ts';
import { collectReviewPages, type ReviewOptions } from './collected-review.ts';
import { createGitHubReader, type ConnectorCall } from './github-reader.ts';
import { reviewInventory, type ReceiptReader, type VerifiedSummary } from './review.ts';
import type { Review } from './decisions.ts';
export type PipelineOptions = ReviewOptions;
export type PipelineResult = { collection: Collection; review: VerifiedSummary | null; status: 'incomplete_inventory' | 'review_error' | 'incomplete_review' | 'complete' };

// Strict review policy: no receipt lookups on incomplete collection.
// The common collector retains only minimized accepted pages in memory.
export async function runInventoryReview(options: PipelineOptions, call: ConnectorCall, reviews: readonly Review[], resolve: ReceiptReader): Promise<PipelineResult> {
  const { owner, pageSize, now, revision } = options;
  const reader = createGitHubReader(owner, call);
  const { collection, accepted } = await collectReviewPages(reader, options);
  if (!collection.coverage.complete || collection.stop !== 'complete') return { collection, review: null, status: 'incomplete_inventory' };
  try {
    const review = reviewInventory(owner, accepted, pageSize, reviews, resolve, now, revision);
    return { collection, review, status: review.summary.complete ? 'complete' : 'incomplete_review' };
  } catch { return { collection, review: null, status: 'review_error' }; }
}
