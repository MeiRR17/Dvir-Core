import { collectAndReview, type CollectedReview, type ReviewOptions } from './collected-review.ts';
import { connectorReader, type RepositoryList } from './connector.ts';
import { boundReceiptReader } from './receipt-binding.ts';
import { prepareReceipt, type RetentionApproval } from './receipt-provision.ts';
import { openReceiptStore } from './receipt-store.ts';
import type { Review } from './decisions.ts';

type Current<T> = { status: 'verified'; checkedAt: number; value: T } | { status: 'denied' | 'unknown' | 'error' };
export type SourceEvidence = Readonly<{ owner: string; repositoryId: string; sourceSha: string; evidence: Uint8Array }>;
// Implementations must authenticate their own inputs; status is not an authentication mechanism.
// Synchronous lookups must be local and bounded; no network or blocking subprocess here.
export type AuditAuthority = Readonly<{
  approval: (owner: string, approvalId: string) => Current<RetentionApproval>;
  source: (owner: string, repositoryId: string) => Current<SourceEvidence>;
}>;
export type AuditConfig = ReviewOptions & Readonly<{ directory: string; secret: Uint8Array; maxAgeMs: number; maxContextAgeMs: number }>;
function current<T>(result: Current<T>, now: number, maxAge: number): T | undefined {
  if (result.status !== 'verified' || !Number.isSafeInteger(result.checkedAt) || result.checkedAt < 0 || result.checkedAt > now || now - result.checkedAt > maxAge) return undefined;
  return result.value;
}
// Canonical candidate path for a future authorized audit. All results refer to config.now,
// not wall-clock completion. No persistence, authority creation or implicit authorization.
export async function runPreparedAudit(config: AuditConfig, list: RepositoryList, reviews: readonly Review[], authority: AuditAuthority): Promise<CollectedReview> {
  const {owner,revision,now,maxContextAgeMs} = config;
  if (!Number.isSafeInteger(maxContextAgeMs) || maxContextAgeMs < 1 || maxContextAgeMs > 300_000 || !Array.isArray(reviews) || reviews.length > 100) throw new Error('invalid audit budget');
  const store = openReceiptStore(config.directory,owner,config.secret,config.maxAgeMs);
  const resolve = boundReceiptReader(owner,revision,now,handle => {
    const prepared = store.readPrepared(handle,now);
    if (!prepared || prepared.receipt.revision !== revision) return undefined;
    const b = prepared.privateBinding;
    const approval = current(authority.approval(owner,b.approvalId),now,maxContextAgeMs);
    if (!approval || approval.owner !== owner || approval.approvalId !== b.approvalId || approval.revision !== revision) return undefined;
    // Reject revoked/changed scope before requesting source evidence.
    const expected = prepareReceipt(approval,{owner,repositoryId:b.repositoryId,decision:b.decision,sourceSha:b.sourceSha,evidenceSha256:b.evidenceSha256,observedAt:b.observedAt},now);
    if (expected.receipt.handle !== handle) return undefined;
    const source = current(authority.source(owner,b.repositoryId),now,maxContextAgeMs);
    if (!source || source.owner !== owner || source.repositoryId !== b.repositoryId) return undefined;
    return {...prepared,approval,currentSourceSha:source.sourceSha,evidence:source.evidence};
  });
  return collectAndReview(connectorReader(owner,list),reviews,resolve,config);
}
