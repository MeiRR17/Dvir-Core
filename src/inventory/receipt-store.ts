import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { closeSync, constants, fstatSync, fsyncSync, linkSync, lstatSync, openSync, readSync, unlinkSync, writeFileSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
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
// Caller provisions a trusted, private directory and secret key. Single owner, no network or deletion API.
export function openReceiptStore(directory: string, owner: string, secret: Uint8Array, maxAgeMs: number) {
  if (typeof directory !== 'string' || typeof owner !== 'string' || !(secret instanceof Uint8Array) || !isAbsolute(directory) || !/^[a-z\d][a-z\d-]{0,38}$/i.test(owner) || secret.byteLength < 32 || !Number.isSafeInteger(maxAgeMs) || maxAgeMs < 1) throw new Error('invalid store configuration');
  const key = Buffer.from(secret);
  function checkDirectory() {
    const stat = lstatSync(directory);
    if (!stat.isDirectory() || (stat.mode & 0o077) !== 0 || stat.uid !== process.getuid?.()) throw new Error('unsafe receipt directory');
  }
  checkDirectory();
  const mac = (payload: string) => createHmac('sha256', key).update('dvir-core:receipt:v1\0').update(payload).digest('hex');
  const file = (handle: string) => {
    if (typeof handle !== 'string' || !handlePattern.test(handle)) throw new Error('invalid handle');
    return join(directory, handle.slice(8) + '.json');
  };
  const store = {
    put(input: StoredReceipt, now: number): void {
      checkDirectory();
      const r = canonical(input);
      if (!Number.isSafeInteger(now) || now < 0 || r.owner !== owner || r.observedAt > now || r.expiresAt <= now || r.expiresAt - r.observedAt > maxAgeMs) throw new Error('receipt outside policy');
      const payload = JSON.stringify(r);
      const bytes = Buffer.from(JSON.stringify({ version:1, payload, mac:mac(payload) }));
      if (bytes.length > maxBytes) throw new Error('receipt too large');
      const target = file(r.handle);
      const temp = join(directory, '.tmp-' + randomBytes(16).toString('hex'));
      const fd = openSync(temp, 'wx', 0o600);
      try {
        try { writeFileSync(fd, bytes); fsyncSync(fd); } finally { closeSync(fd); }
        linkSync(temp, target); // atomic publication; existing handle cannot be overwritten
        const dir = openSync(directory, constants.O_RDONLY);
        try { fsyncSync(dir); } finally { closeSync(dir); }
      } finally { unlinkSync(temp); }
    },
    read(handle: string, now: number): StoredReceipt | undefined {
      try {
        checkDirectory();
        if (!Number.isSafeInteger(now) || now < 0) return undefined;
        const fd = openSync(file(handle), constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
        let text: string;
        try {
          const stat = fstatSync(fd);
          if (!stat.isFile() || stat.size > maxBytes || (stat.mode & 0o077) !== 0 || stat.uid !== process.getuid?.()) return undefined;
          const bytes = Buffer.alloc(maxBytes + 1);
          let total = 0;
          while (total < bytes.length) {
            const count = readSync(fd, bytes, total, bytes.length - total, null);
            if (!count) break;
            total += count;
          }
          if (total > maxBytes) return undefined;
          text = bytes.subarray(0, total).toString('utf8');
        } finally { closeSync(fd); }
        if (Buffer.byteLength(text) > maxBytes) return undefined;
        const envelope = JSON.parse(text);
        if (envelope.version !== 1 || typeof envelope.payload !== 'string' || typeof envelope.mac !== 'string' || !/^[a-f0-9]{64}$/.test(envelope.mac)) return undefined;
        if (!timingSafeEqual(Buffer.from(envelope.mac,'hex'), Buffer.from(mac(envelope.payload),'hex'))) return undefined;
        const r = canonical(JSON.parse(envelope.payload));
        if (JSON.stringify(r) !== envelope.payload || r.handle !== handle || r.owner !== owner || r.observedAt > now || r.expiresAt <= now || r.expiresAt - r.observedAt > maxAgeMs) return undefined;
        return r;
      } catch { return undefined; }
    },
  };
  return {
    put(input: Receipt, now: number): void { store.put(input, now); },
    read(handle: string, now: number): Receipt | undefined {
      const found = store.read(handle,now);
      if (!found) return undefined;
      const {privateBinding: _binding,...receipt} = found;
      return receipt;
    },
    putPrepared(input: PreparedReceipt, now: number): void {
      if (!input?.privateBinding) throw new Error('missing binding');
      store.put({...input.receipt,privateBinding:input.privateBinding},now);
    },
    readPrepared(handle: string, now: number): PreparedReceipt | undefined {
      const found = store.read(handle,now);
      if (!found?.privateBinding) return undefined;
      const {privateBinding,...receipt} = found;
      return {receipt,privateBinding};
    },
  };
}
