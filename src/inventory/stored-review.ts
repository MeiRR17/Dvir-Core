import { reviewInventory, type VerifiedSummary } from './review.ts';
import { openReceiptStore } from './receipt-store.ts';
import type { Review } from './decisions.ts';

export type StoredReviewConfig = Readonly<{ directory: string; owner: string; secret: Uint8Array; maxAgeMs: number }>;
// Read-only boundary: same owner and clock are used for file validation and review.
export function reviewStoredInventory(config: StoredReviewConfig, pages: readonly unknown[], pageSize: number,
  reviews: readonly Review[], now: number, revision: string): VerifiedSummary {
  if (!Number.isSafeInteger(now) || now < 0 || typeof revision !== 'string' || !/^[a-f0-9]{40}$/.test(revision) || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) throw new Error('invalid review configuration');
  const store = openReceiptStore(config.directory, config.owner, config.secret, config.maxAgeMs);
  return reviewInventory(config.owner, pages, pageSize, reviews, handle => store.read(handle, now), now, revision);
}
