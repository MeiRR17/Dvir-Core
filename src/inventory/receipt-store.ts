import { createHash } from 'node:crypto';
import { isAbsolute } from 'node:path';
import { openAuthenticatedJsonFileStore } from '../storage/authenticated-json-file-store.ts';
import type { PreparedReceipt } from './receipt-provision.ts';

export type Receipt = Readonly<{ handle: string; owner: string; repositoryId: string; decision: 'adopt' | 'defer' | 'not_applicable'; revision: string; observedAt: number; expiresAt: number }>;
type StoredReceipt = Receipt & { privateBinding?: PreparedReceipt['privateBinding'] };
const handlePattern = /^receipt:[a-zA-Z0-9_-]{1,80}$/;
const maxBytes = 4096;

function canonical(r: StoredReceipt): StoredReceipt {
  if (!r || typeof r !== 'object' || ['handle','owner','repositoryId','decision','revision'].some(field => typeof (r as unknown as Record<string,unknown>)[field] !== 'string') || !handlePattern.test(r.handle) || !/^[a-z\d][a-z\d-]{0,38}$/i.test(r.owner) || !/^[1-9]\d*$/.test(r.repositoryId) || !['adopt','defer','not_applicable'].includes(r.decision) || !/^[a-f0-9]{40}$/.test(r.revision) || !Number.isSafeInteger(r.observedAt) || r.observedAt < 0 || !Number.isSafeInteger(r.expiresAt) || r.expiresAt <= r.observedAt) throw new Error('invalid receipt');
  const base = { handle:r.handle, owner:r.owner, repositoryId:r.repositoryId, decision:r.decision, revision:r.revision, observedAt:r.observedAt, expiresAt:r.expiresAt };
  if (r.privateBinding === undefined) return base;
  const b = r.privateBinding;
  if (!b || b.version !== 1 || typeof b.approvalId !== 'string' || !/^[a-zA-Z0-9_-]{1,80}$/.test(b.approvalId) || typeof b.sourceSha !== 'string' || !/^[a-f0-9]{40}$/.test(b.sourceSha) || typeof b.evidenceSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(b.evidenceSha256) || b.owner !== base.owner || b.repositoryId !== base.repositoryId || b.decision !== base.decision || b.revision !== base.revision || b.observedAt !== base.observedAt || b.expiresAt !== base.expiresAt) throw new Error('invalid binding');
  const privateBinding = {version:1 as const,approvalId:b.approvalId,owner:b.owner,repositoryId:b.repositoryId,decision:b.decision,revision:b.revision,sourceSha:b.sourceSha,evidenceSha256:b.evidenceSha256,observedAt:b.observedAt,expiresAt:b.expiresAt};
  const handle = 'receipt:' + createHash('sha256').update('dvir-core:audit-binding:v1\0').update(JSON.stringify(privateBinding)).digest('hex');
  if (handle !== base.handle) throw new Error('binding handle mismatch');
  return {...base,privateBinding};
}

// The generic store preserves the existing v1 receipt envelope and HMAC domain.
// Caller provisions the private directory and key; no network or deletion API.
export function openReceiptStore(directory: string, owner: string, secret: Uint8Array, maxAgeMs: number) {
  if (typeof directory !== 'string' || typeof owner !== 'string' || !(secret instanceof Uint8Array) || !isAbsolute(directory) || !/^[a-z\d][a-z\d-]{0,38}$/i.test(owner) || secret.byteLength < 32 || !Number.isSafeInteger(maxAgeMs) || maxAgeMs < 1) throw new Error('invalid store configuration');
  const files = openAuthenticatedJsonFileStore(directory, secret, 'dvir-core:receipt:v1\0', maxBytes);
  const file = (handle: string) => {
    if (typeof handle !== 'string' || !handlePattern.test(handle)) throw new Error('invalid handle');
    return handle.slice(8) + '.json';
  };
  function put(input: StoredReceipt, now: number): void {
    const r = canonical(input);
    if (!Number.isSafeInteger(now) || now < 0 || r.owner !== owner || r.observedAt > now || r.expiresAt <= now || r.expiresAt - r.observedAt > maxAgeMs) throw new Error('receipt outside policy');
    files.write(file(r.handle), JSON.stringify(r));
  }
  function read(handle: string, now: number): StoredReceipt | undefined {
    try {
      if (!Number.isSafeInteger(now) || now < 0) return undefined;
      const payload = files.read(file(handle));
      if (payload === undefined) return undefined;
      const r = canonical(JSON.parse(payload));
      if (JSON.stringify(r) !== payload || r.handle !== handle || r.owner !== owner || r.observedAt > now || r.expiresAt <= now || r.expiresAt - r.observedAt > maxAgeMs) return undefined;
      return r;
    } catch { return undefined; }
  }
  return {
    put(input: Receipt, now: number): void { put(input, now); },
    read(handle: string, now: number): Receipt | undefined {
      const found = read(handle, now);
      if (!found) return undefined;
      const {privateBinding: _binding,...receipt} = found;
      return receipt;
    },
    putPrepared(input: PreparedReceipt, now: number): void {
      if (!input?.privateBinding) throw new Error('missing binding');
      put({...input.receipt,privateBinding:input.privateBinding},now);
    },
    readPrepared(handle: string, now: number): PreparedReceipt | undefined {
      const found = read(handle, now);
      if (!found?.privateBinding) return undefined;
      const {privateBinding,...receipt} = found;
      return {receipt,privateBinding};
    },
  };
}
