import { isAbsolute } from 'node:path';
import { openAuthenticatedJsonFileStore } from '../storage/authenticated-json-file-store.ts';

export type Receipt = Readonly<{ handle: string; owner: string; repositoryId: string; decision: 'adopt' | 'defer' | 'not_applicable'; revision: string; observedAt: number; expiresAt: number }>;
const handlePattern = /^receipt:[a-zA-Z0-9_-]{1,80}$/;
const maxBytes = 4096;
function canonical(r: Receipt): Receipt {
  if (!r || typeof r !== 'object' || ['handle','owner','repositoryId','decision','revision'].some(field => typeof (r as unknown as Record<string,unknown>)[field] !== 'string') || !handlePattern.test(r.handle) || !/^[a-z\d][a-z\d-]{0,38}$/i.test(r.owner) || !/^[1-9]\d*$/.test(r.repositoryId) || !['adopt','defer','not_applicable'].includes(r.decision) || !/^[a-f0-9]{40}$/.test(r.revision) || !Number.isSafeInteger(r.observedAt) || r.observedAt < 0 || !Number.isSafeInteger(r.expiresAt) || r.expiresAt <= r.observedAt) throw new Error('invalid receipt');
  return { handle:r.handle, owner:r.owner, repositoryId:r.repositoryId, decision:r.decision, revision:r.revision, observedAt:r.observedAt, expiresAt:r.expiresAt };
}
// Caller provisions a trusted, private directory and secret key. Single owner, no network or deletion API.
export function openReceiptStore(directory: string, owner: string, secret: Uint8Array, maxAgeMs: number) {
  if (typeof directory !== 'string' || typeof owner !== 'string' || !(secret instanceof Uint8Array) || !isAbsolute(directory) || !/^[a-z\d][a-z\d-]{0,38}$/i.test(owner) || secret.byteLength < 32 || !Number.isSafeInteger(maxAgeMs) || maxAgeMs < 1) throw new Error('invalid store configuration');
  const files = openAuthenticatedJsonFileStore(directory, secret, 'dvir-core:receipt:v1\0', maxBytes);
  const file = (handle: string) => {
    if (typeof handle !== 'string' || !handlePattern.test(handle)) throw new Error('invalid handle');
    return handle.slice(8) + '.json';
  };
  return {
    put(input: Receipt, now: number): void {
      const r = canonical(input);
      if (!Number.isSafeInteger(now) || now < 0 || r.owner !== owner || r.observedAt > now || r.expiresAt <= now || r.expiresAt - r.observedAt > maxAgeMs) throw new Error('receipt outside policy');
      files.write(file(r.handle), JSON.stringify(r));
    },
    read(handle: string, now: number): Receipt | undefined {
      try {
        if (!Number.isSafeInteger(now) || now < 0) return undefined;
        const payload = files.read(file(handle));
        if (payload === undefined) return undefined;
        const r = canonical(JSON.parse(payload));
        if (JSON.stringify(r) !== payload || r.handle !== handle || r.owner !== owner || r.observedAt > now || r.expiresAt <= now || r.expiresAt - r.observedAt > maxAgeMs) return undefined;
        return r;
      } catch { return undefined; }
    },
  };
}
