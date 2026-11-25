import { createHash } from 'node:crypto';
import { prepareReceipt, type RetentionApproval, type AuditObservation, type PreparedReceipt } from './receipt-provision.ts';
import type { Receipt } from './receipt-store.ts';
import type { ReceiptReader } from './review.ts';

const MAX_EVIDENCE_BYTES = 64 * 1024;
const MAX_BATCH_BYTES = 1024 * 1024;
const MAX_BATCH = 100;
const receiptFields = ['handle','owner','repositoryId','decision','revision','observedAt','expiresAt'] as const;
const bindingFields = ['version','approvalId','owner','repositoryId','decision','revision','sourceSha','evidenceSha256','observedAt','expiresAt'] as const;
export type EvidenceInput = Omit<AuditObservation,'evidenceSha256'> & Readonly<{ evidence: Uint8Array }>;
function digest(bytes: Uint8Array): string {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength === 0 || bytes.byteLength > MAX_EVIDENCE_BYTES) throw new Error('invalid evidence size');
  return createHash('sha256').update(bytes).digest('hex');
}
// All-or-nothing preparation; no writes, raw bytes, or authorization inferred.
export function prepareAuditBatch(approval: RetentionApproval, inputs: readonly EvidenceInput[], now: number): PreparedReceipt[] {
  if (!Array.isArray(inputs) || inputs.length < 1 || inputs.length > MAX_BATCH) throw new Error('invalid batch size');
  const seen = new Set<string>();
  let total = 0;
  const result: PreparedReceipt[] = [];
  for (const input of inputs) {
    if (!input || seen.has(input.repositoryId)) throw new Error('duplicate observation');
    const evidenceSha256 = digest(input.evidence);
    total += input.evidence.byteLength;
    if (total > MAX_BATCH_BYTES) throw new Error('batch evidence budget exceeded');
    result.push(prepareReceipt(approval,{owner:input.owner,repositoryId:input.repositoryId,decision:input.decision,sourceSha:input.sourceSha,observedAt:input.observedAt,evidenceSha256},now));
    seen.add(input.repositoryId);
  }
  return result;
}
export type BoundEvidence = Readonly<{ receipt: Receipt; privateBinding: PreparedReceipt['privateBinding']; approval: RetentionApproval; currentSourceSha: string; evidence: Uint8Array }>;
// Trusted reader must supply authenticated current approval and source context.
// This verifies consistency, not the factual correctness of the reviewed content.
export function verifyBoundReceipt(input: BoundEvidence, now: number): Receipt | undefined {
  try {
    const {receipt,privateBinding:b,approval,currentSourceSha,evidence} = input;
    if (b.version !== 1 || b.sourceSha !== currentSourceSha || b.evidenceSha256 !== digest(evidence)) return undefined;
    const expected = prepareReceipt(approval,{owner:b.owner,repositoryId:b.repositoryId,decision:b.decision,sourceSha:b.sourceSha,evidenceSha256:b.evidenceSha256,observedAt:b.observedAt},now);
    if (!receiptFields.every(k => receipt[k] === expected.receipt[k]) || !bindingFields.every(k => b[k] === expected.privateBinding[k])) return undefined;
    return expected.receipt;
  } catch { return undefined; }
}
// Adapter for the existing review reducer. The lookup is private and read-only.
export function boundReceiptReader(owner: string, revision: string, now: number, lookup: (handle: string) => BoundEvidence | undefined): ReceiptReader {
  if (typeof owner !== 'string' || !/^[a-z\d][a-z\d-]{0,38}$/i.test(owner) || typeof revision !== 'string' || !/^[a-f0-9]{40}$/.test(revision) || !Number.isSafeInteger(now) || now < 0) throw new Error('invalid reader configuration');
  return handle => {
    if (typeof handle !== 'string' || !/^receipt:[a-f0-9]{64}$/.test(handle)) return undefined;
    try {
      const found = lookup(handle);
      if (!found || found.receipt.handle !== handle || found.receipt.owner !== owner || found.receipt.revision !== revision) return undefined;
      return verifyBoundReceipt(found,now);
    } catch { return undefined; }
  };
}
