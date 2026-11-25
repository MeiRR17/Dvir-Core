import { openReceiptStore } from './receipt-store.ts';
import { reviewInventory, type VerifiedSummary } from './review.ts';
import type { Review } from './decisions.ts';

export type LocalReviewOptions = Readonly<{
  directory: string;
  owner: string;
  key: Uint8Array;
  maxAgeMs: number;
  now: number;
  revision: string;
  pageSize: number;
}>;

// Read-only composition. The trusted caller provisions the private root and key.
// Store setup failures are explicit; individual invalid receipts remain unresolved.
export function reviewStoredInventory(options: LocalReviewOptions, pages: readonly unknown[], reviews: readonly Review[]): VerifiedSummary {
  const { directory, owner, key, maxAgeMs, now, revision, pageSize } = options;
  const store = openReceiptStore(directory, owner, key, maxAgeMs);
  return reviewInventory(owner, pages, pageSize, reviews, handle => store.read(handle, now), now, revision);
}
