import { AuthenticatedStoreWriteError } from '../storage/authenticated-json-file-store.ts';
import type { Receipt, openReceiptStore } from './receipt-store.ts';
import type { PreparedReceipt } from './receipt-provision.ts';

type Store = Pick<ReturnType<typeof openReceiptStore>, 'put' | 'read'>;
type PreparedStore = Pick<ReturnType<typeof openReceiptStore>, 'putPrepared' | 'readPrepared'>;
export type WriteOutcome = 'written' | 'observed_after_error' | 'published_unconfirmed' | 'unconfirmed';
const receiptFields = ['handle','owner','repositoryId','decision','revision','observedAt','expiresAt'] as const;
const bindingFields = ['version','approvalId','owner','repositoryId','decision','revision','sourceSha','evidenceSha256','observedAt','expiresAt'] as const;

function sameReceipt(a: Receipt, b: Receipt): boolean {
  return receiptFields.every(field => a[field] === b[field]);
}
function samePrepared(a: PreparedReceipt, b: PreparedReceipt): boolean {
  return sameReceipt(a.receipt,b.receipt) && bindingFields.every(field => a.privateBinding[field] === b.privateBinding[field]);
}
function afterError<T>(error: unknown, observed: T | undefined, expected: T, equal: (a:T,b:T)=>boolean): WriteOutcome {
  if (!observed || !equal(observed,expected)) return 'unconfirmed';
  if (error instanceof AuthenticatedStoreWriteError && error.publication === 'published_unconfirmed') return 'published_unconfirmed';
  return 'observed_after_error';
}

// A read after an exception is visibility evidence, not proof of durability.
// Never retry, delete or overwrite automatically.
export function writeReceiptOnce(store: Store, receipt: Receipt, now: number): WriteOutcome {
  try { store.put(receipt, now); return 'written'; }
  catch (error) {
    try { return afterError(error,store.read(receipt.handle,now),receipt,sameReceipt); }
    catch { return 'unconfirmed'; }
  }
}

// Prepared receipts require equality of the private binding as well as the public envelope.
export function writePreparedReceiptOnce(store: PreparedStore, receipt: PreparedReceipt, now: number): WriteOutcome {
  try { store.putPrepared(receipt, now); return 'written'; }
  catch (error) {
    try { return afterError(error,store.readPrepared(receipt.receipt.handle,now),receipt,samePrepared); }
    catch { return 'unconfirmed'; }
  }
}
