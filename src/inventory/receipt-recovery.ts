import type { Receipt, openReceiptStore } from './receipt-store.ts';

type Store = Pick<ReturnType<typeof openReceiptStore>, 'put' | 'read'>;
export type WriteOutcome = 'written' | 'observed_after_error' | 'unconfirmed';
const fields = ['handle','owner','repositoryId','decision','revision','observedAt','expiresAt'] as const;

// A read after an exception is visibility evidence, not proof of durability.
// No automatic retry, deletion or overwrite. The caller owns the trusted store.
export function writeReceiptOnce(store: Store, receipt: Receipt, now: number): WriteOutcome {
  try { store.put(receipt, now); return 'written'; }
  catch {
    try {
      const observed = store.read(receipt.handle, now);
      if (observed && fields.every(field => observed[field] === receipt[field])) return 'observed_after_error';
    } catch { /* do not expose private storage errors */ }
    return 'unconfirmed';
  }
}
