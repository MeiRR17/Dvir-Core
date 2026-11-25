import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { closeSync, constants, fstatSync, fsyncSync, linkSync, lstatSync, openSync, readSync, unlinkSync, writeFileSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
export type BenchmarkReceipt = Readonly<{ handle: string; scope: string; revision: string; workloadDigest: string; provider: 'ollama' | 'mlx'; source: 'local'; measurementDigest: string; exitCode: 0; observedAt: number; expiresAt: number }>;
const handlePattern = /^benchmark:[a-zA-Z0-9_-]{1,80}$/;
const scopePattern = /^[a-zA-Z0-9_-]{1,80}$/;
const sha = /^[a-f0-9]{40}$/;
const digest = /^[a-f0-9]{64}$/;
const maxAge = 86400000, maxBytes = 4096;
function matches(value: unknown, pattern: RegExp): boolean { return typeof value === 'string' && pattern.test(value); }
function time(value: unknown): value is number { return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0; }
function canonical(value: unknown): BenchmarkReceipt {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid benchmark receipt');
  const r = value as BenchmarkReceipt;
  if (!matches(r.handle, handlePattern) || !matches(r.scope, scopePattern) || !matches(r.revision, sha) || !matches(r.workloadDigest, digest) || !matches(r.measurementDigest, digest) || (r.provider !== 'ollama' && r.provider !== 'mlx') || r.source !== 'local' || r.exitCode !== 0 || !time(r.observedAt) || !time(r.expiresAt) || r.expiresAt <= r.observedAt || r.expiresAt - r.observedAt > maxAge) throw new Error('invalid benchmark receipt');
  return { handle: r.handle, scope: r.scope, revision: r.revision, workloadDigest: r.workloadDigest, provider: r.provider, source: 'local', measurementDigest: r.measurementDigest, exitCode: 0, observedAt: r.observedAt, expiresAt: r.expiresAt };
}
// Dedicated caller-provisioned private directory with trusted ancestors and key.
// Authentication protects stored bytes, not the truth of upstream measurements.
export function openBenchmarkReceiptStore(directory: string, scope: string, secret: Uint8Array) {
  if (typeof directory !== 'string' || !isAbsolute(directory) || !matches(scope, scopePattern) || !(secret instanceof Uint8Array) || secret.byteLength < 32) throw new Error('invalid benchmark store configuration');
  const key = Buffer.from(secret);
  function checkDirectory() {
    const stat = lstatSync(directory);
    if (!stat.isDirectory() || (stat.mode & 0o077) !== 0 || stat.uid !== process.getuid?.()) throw new Error('unsafe benchmark directory');
  }
  checkDirectory();
  const mac = (payload: string) => createHmac('sha256', key).update('dvir-core:benchmark-receipt:v1\0').update(payload).digest('hex');
  const file = (handle: string) => { if (!matches(handle, handlePattern)) throw new Error('invalid benchmark handle'); return join(directory, handle.slice(10) + '.json'); };
  const fresh = (r: BenchmarkReceipt, now: number) => time(now) && r.scope === scope && r.observedAt <= now && now < r.expiresAt;
  return {
    put(value: BenchmarkReceipt, now: number): void {
      checkDirectory();
      const r = canonical(value);
      if (!fresh(r, now)) throw new Error('benchmark receipt outside policy');
      const payload = JSON.stringify(r), bytes = Buffer.from(JSON.stringify({ version: 1, payload, mac: mac(payload) }));
      if (bytes.length > maxBytes) throw new Error('benchmark receipt too large');
      const target = file(r.handle), temp = join(directory, '.tmp-' + randomBytes(16).toString('hex'));
      const fd = openSync(temp, 'wx', 0o600);
      try {
        try { writeFileSync(fd, bytes); fsyncSync(fd); } finally { closeSync(fd); }
        linkSync(temp, target);
        const dir = openSync(directory, constants.O_RDONLY);
        try { fsyncSync(dir); } finally { closeSync(dir); }
      } finally { unlinkSync(temp); }
    },
    read(handle: string, now: number): BenchmarkReceipt | undefined {
      try {
        checkDirectory();
        if (!time(now)) return undefined;
        const fd = openSync(file(handle), constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
        let payloadText: string;
        try {
          const stat = fstatSync(fd);
          if (!stat.isFile() || stat.size > maxBytes || (stat.mode & 0o077) !== 0 || stat.uid !== process.getuid?.()) return undefined;
          const buffer = Buffer.alloc(maxBytes + 1);
          let total = 0;
          while (total < buffer.length) {
            const count = readSync(fd, buffer, total, buffer.length - total, null);
            if (!count) break;
            total += count;
          }
          if (total > maxBytes) return undefined;
          payloadText = buffer.subarray(0, total).toString('utf8');
        } finally { closeSync(fd); }
        const envelope = JSON.parse(payloadText);
        if (envelope.version !== 1 || typeof envelope.payload !== 'string' || !matches(envelope.mac, digest)) return undefined;
        if (!timingSafeEqual(Buffer.from(envelope.mac, 'hex'), Buffer.from(mac(envelope.payload), 'hex'))) return undefined;
        const r = canonical(JSON.parse(envelope.payload));
        return JSON.stringify(r) === envelope.payload && r.handle === handle && fresh(r, now) ? r : undefined;
      } catch { return undefined; }
    },
  };
}
