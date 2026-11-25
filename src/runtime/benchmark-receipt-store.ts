import { openAuthenticatedJsonFileStore } from '../storage/authenticated-json-file-store.ts';
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
  if (typeof directory !== 'string' || !matches(scope, scopePattern) || !(secret instanceof Uint8Array) || secret.byteLength < 32) throw new Error('invalid benchmark store configuration');
  const files = openAuthenticatedJsonFileStore(directory, secret, 'dvir-core:benchmark-receipt:v1\0', maxBytes);
  const file = (handle: string) => { if (!matches(handle, handlePattern)) throw new Error('invalid benchmark handle'); return handle.slice(10) + '.json'; };
  const fresh = (r: BenchmarkReceipt, now: number) => time(now) && r.scope === scope && r.observedAt <= now && now < r.expiresAt;
  return {
    put(value: BenchmarkReceipt, now: number): void {
      const r = canonical(value);
      if (!fresh(r, now)) throw new Error('benchmark receipt outside policy');
      files.write(file(r.handle), JSON.stringify(r));
    },
    read(handle: string, now: number): BenchmarkReceipt | undefined {
      try {
        if (!time(now)) return undefined;
        const payload = files.read(file(handle));
        if (payload === undefined) return undefined;
        const r = canonical(JSON.parse(payload));
        return JSON.stringify(r) === payload && r.handle === handle && fresh(r, now) ? r : undefined;
      } catch { return undefined; }
    },
  };
}
