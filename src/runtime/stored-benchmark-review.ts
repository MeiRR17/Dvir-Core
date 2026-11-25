import { reviewBenchmark, type BenchmarkContext, type BenchmarkReview } from './benchmark-evidence.ts';
import { openBenchmarkReceiptStore } from './benchmark-receipt-store.ts';

export type BenchmarkStorage = Readonly<{ directory: string; scope: string; secret: Uint8Array }>;
// Read-only integration. The caller authorizes context and provides a private
// store configuration. Fixture/unmeasured inputs do not open the store.
// Storage errors fail closed through reviewBenchmark's private resolver boundary.
export function reviewStoredBenchmark(input: unknown, context: BenchmarkContext, storage: BenchmarkStorage): BenchmarkReview {
  const bound = { ...context };
  return reviewBenchmark(input, bound, handle => {
    if (storage.scope !== bound.scope) return undefined;
    return openBenchmarkReceiptStore(storage.directory, storage.scope, storage.secret).read(handle, bound.now);
  });
}
