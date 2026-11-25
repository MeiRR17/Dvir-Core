import { runInventoryReview, type PipelineOptions, type PipelineResult } from './pipeline.ts';
import { openReceiptStore } from './receipt-store.ts';
import type { ConnectorCall } from './github-reader.ts';
import type { Review } from './decisions.ts';

export type PrivateStoreConfig = Readonly<{ directory: string; secret: Uint8Array; maxAgeMs: number }>;
// Owner and clock come from a single pipeline configuration. No writes or secret logging.
// Fail before contacting the provider if the private store cannot be opened.
export async function runStoredInventoryReview(options: PipelineOptions, config: PrivateStoreConfig, call: ConnectorCall, reviews: readonly Review[]): Promise<PipelineResult> {
  const snapshot = { ...options };
  const store = openReceiptStore(config.directory, snapshot.owner, config.secret, config.maxAgeMs);
  return runInventoryReview(snapshot, call, reviews, handle => store.read(handle, snapshot.now));
}
