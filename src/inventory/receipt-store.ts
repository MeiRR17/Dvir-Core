import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { constants, openSync, closeSync, fstatSync, lstatSync, readSync, writeFileSync, fsyncSync, linkSync, unlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';
export type Receipt = { handle: string; owner: string; repositoryId: string; decision: 'adopt' | 'defer' | 'not_applicable'; revision: string; observedAt: number; expiresAt: number };
const pattern = /^receipt:[a-zA-Z0-9_-]{1,80}$/;
const MAX_BYTES = 4096;
const MAX_LIFETIME = 30 * 86400_000;
function canonical(value: unknown, owner: string): Receipt {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid receipt');
  const r = value as Receipt;
  if (typeof r.handle !== 'string' || !pattern.test(r.handle) || r.owner !== owner || typeof r.repositoryId !== 'string' || !/^[1-9]\d{0,39}$/.test(r.repositoryId) || !['adopt','defer','not_applicable'].includes(r.decision) || typeof r.revision !== 'string' || !/^[a-f0-9]{40}$/.test(r.revision) || !Number.isSafeInteger(r.observedAt) || !Number.isSafeInteger(r.expiresAt) || r.observedAt < 0 || r.expiresAt <= r.observedAt || r.expiresAt - r.observedAt > MAX_LIFETIME) throw new Error('invalid receipt');
  return { handle:r.handle, owner:r.owner, repositoryId:r.repositoryId, decision:r.decision, revision:r.revision, observedAt:r.observedAt, expiresAt:r.expiresAt };
}
// The caller provisions a trusted, owner-only directory and a separate secret key.
// Expired receipts are never returned. Physical pruning and key rotation are separate tasks.
export function openReceiptStore(directory: string, owner: string, key: Uint8Array) {
  if (!/^[a-z0-9][a-z0-9-]{0,38}$/i.test(owner) || key.byteLength < 32) throw new Error('invalid store configuration');
  const root = resolve(directory);
  const secret = Buffer.from(key);
  function checkRoot() {
    const st = lstatSync(root);
    if (!st.isDirectory() || (st.mode & 0o077) !== 0 || st.uid !== process.getuid?.()) throw new Error('unsafe receipt directory');
  }
  checkRoot();
  const mac = (body: string) => createHmac('sha256', secret).update(body).digest('hex');
  function path(handle: string) { if (!pattern.test(handle)) throw new Error('invalid handle'); return join(root, handle.slice(8) + '.json'); }
  function put(value: unknown, now: number): void {
    checkRoot();
    const receipt = canonical(value, owner);
    if (!Number.isSafeInteger(now) || receipt.observedAt > now || receipt.expiresAt <= now) throw new Error('invalid receipt time');
    const body = JSON.stringify(receipt);
    const data = JSON.stringify({ body, mac: mac(body) });
    if (Buffer.byteLength(data) > MAX_BYTES) throw new Error('receipt too large');
    const target = path(receipt.handle);
    const temporary = join(root, '.tmp-' + randomBytes(16).toString('hex'));
    const fd = openSync(temporary, 'wx', 0o600);
    try {
      writeFileSync(fd, data); fsyncSync(fd);
      linkSync(temporary, target); // atomic no-replace publication
    } finally { closeSync(fd); unlinkSync(temporary); }
    const dir = openSync(root, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW);
    try { fsyncSync(dir); } finally { closeSync(dir); }
  }
  function read(handle: string, now: number): Receipt | undefined {
    try {
      checkRoot();
      if (!Number.isSafeInteger(now) || now < 0 || typeof handle !== 'string') return undefined;
      const fd = openSync(path(handle), constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
      try {
        const st = fstatSync(fd);
        if (!st.isFile() || st.uid !== process.getuid?.() || (st.mode & 0o077) || st.size > MAX_BYTES) return undefined;
        const bytes = Buffer.alloc(MAX_BYTES + 1);
        let n = 0;
        while (n < bytes.length) { const got = readSync(fd, bytes, n, bytes.length - n, null); if (!got) break; n += got; }
        if (n > MAX_BYTES) return undefined;
        const envelope = JSON.parse(bytes.subarray(0,n).toString('utf8'));
        if (typeof envelope.body !== 'string' || typeof envelope.mac !== 'string' || !/^[a-f0-9]{64}$/.test(envelope.mac) || !timingSafeEqual(Buffer.from(mac(envelope.body),'hex'), Buffer.from(envelope.mac,'hex'))) return undefined;
        const receipt = canonical(JSON.parse(envelope.body), owner);
        return receipt.handle === handle && receipt.observedAt <= now && receipt.expiresAt > now ? receipt : undefined;
      } finally { closeSync(fd); }
    } catch { return undefined; }
  }
  return { put, read };
}
