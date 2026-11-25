import { createHash } from 'node:crypto';
import type { Receipt } from './receipt-store.ts';

export type RetentionApproval = Readonly<{
  owner: string; revision: string; approvalId: string; approvedAt: number;
  expiresAt: number; maxAgeMs: number; repositoryIds: readonly string[];
}>;
export type AuditObservation = Readonly<{
  owner: string; repositoryId: string; decision: Receipt['decision'];
  sourceSha: string; evidenceSha256: string; observedAt: number;
}>;
export type PreparedReceipt = { receipt: Receipt; privateBinding: Readonly<{
  version: 1; approvalId: string; owner: string; repositoryId: string; decision: Receipt['decision'];
  revision: string; sourceSha: string; evidenceSha256: string; observedAt: number; expiresAt: number;
}> };
const matches = (value: unknown, pattern: RegExp): value is string => typeof value === 'string' && pattern.test(value);
const time = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const id = /^[1-9]\d*$/;
const sha = /^[a-f0-9]{40}$/;
const maxRetention = 30 * 24 * 60 * 60 * 1000;

// Pure preparation; the caller must authenticate the approval and source observation.
// Neither this function nor its result authorizes persistence or verifies source truth.
export function prepareReceipt(approval: RetentionApproval, observation: AuditObservation, now: number): PreparedReceipt {
  if (!approval || !observation || !time(now) || !matches(approval.owner,/^[a-z\d][a-z\d-]{0,38}$/i) || !matches(approval.revision,sha) || !matches(approval.approvalId,/^[a-zA-Z0-9_-]{1,80}$/) || !time(approval.approvedAt) || !time(approval.expiresAt) || approval.approvedAt > now || approval.expiresAt <= now || !time(approval.maxAgeMs) || approval.maxAgeMs < 1 || approval.maxAgeMs > maxRetention || !Array.isArray(approval.repositoryIds) || approval.repositoryIds.length > 10_000 || !approval.repositoryIds.every(r => matches(r,id)) || new Set(approval.repositoryIds).size !== approval.repositoryIds.length) throw new Error('invalid retention approval');
  if (observation.owner !== approval.owner || !matches(observation.repositoryId,id) || !approval.repositoryIds.includes(observation.repositoryId) || !['adopt','defer','not_applicable'].includes(observation.decision) || !matches(observation.sourceSha,sha) || !matches(observation.evidenceSha256,/^[a-f0-9]{64}$/) || !time(observation.observedAt) || observation.observedAt < approval.approvedAt || observation.observedAt > now) throw new Error('invalid audit observation');
  const limit = observation.observedAt + approval.maxAgeMs;
  if (!time(limit)) throw new Error('invalid receipt lifetime');
  const expiresAt = Math.min(limit,approval.expiresAt);
  if (expiresAt <= now) throw new Error('expired audit observation');
  const privateBinding = {version:1 as const,approvalId:approval.approvalId,owner:approval.owner,repositoryId:observation.repositoryId,decision:observation.decision,revision:approval.revision,sourceSha:observation.sourceSha,evidenceSha256:observation.evidenceSha256,observedAt:observation.observedAt,expiresAt};
  const handle = 'receipt:' + createHash('sha256').update('dvir-core:audit-binding:v1\0').update(JSON.stringify(privateBinding)).digest('hex');
  return {receipt:{handle,owner:approval.owner,repositoryId:observation.repositoryId,decision:observation.decision,revision:approval.revision,observedAt:observation.observedAt,expiresAt},privateBinding};
}
