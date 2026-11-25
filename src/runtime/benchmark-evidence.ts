import { createHash } from 'node:crypto';
import { summarizeBenchmark, type BenchmarkSummary } from './benchmark.ts';
export type BenchmarkContext = Readonly<{ handle: string; scope: string; revision: string; workloadDigest: string; now: number }>;
export type BenchmarkReview = { state: 'not_measured' | 'unverified'; summary: null } | { state: 'fixture' | 'receipt_matched'; summary: BenchmarkSummary };
const maxAgeMs = 24 * 60 * 60 * 1000;
const handlePattern = /^benchmark:[a-zA-Z0-9_-]{1,80}$/;
const scopePattern = /^[a-zA-Z0-9_-]{1,80}$/;
const sha = /^[a-f0-9]{40}$/;
const digest = /^[a-f0-9]{64}$/;
function record(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('invalid benchmark record');
  return input as Record<string, unknown>;
}
function snapshot(input: unknown) {
  const { provider, source, samples } = record(input);
  if (!Array.isArray(samples) || samples.length < 1 || samples.length > 100) throw new Error('invalid benchmark samples');
  return { provider, source, samples: Array.from(samples, raw => {
    const row = record(raw);
    return { firstTokenMs: row.firstTokenMs, decodeMs: row.decodeMs, completionTokens: row.completionTokens, peakProcessBytes: row.peakProcessBytes, structuredSuccess: row.structuredSuccess, toolSuccess: row.toolSuccess };
  }) };
}
// Private measurement digest, not an authentication credential or a public report field.
// Hash ordered validated samples, not just their potentially colliding aggregates.
export function benchmarkMeasurementDigest(input: unknown): string {
  const batch = snapshot(input);
  summarizeBenchmark(batch);
  return createHash('sha256').update('dvir-core:benchmark:v1\0').update(JSON.stringify(batch)).digest('hex');
}
function timestamp(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}
// Trusted caller must authorize scope/workload and supply an authenticated private
// receipt resolver. A matching receipt alone is not proof of actual inference.
export function reviewBenchmark(input: unknown, context: BenchmarkContext, resolve: (handle: string) => unknown): BenchmarkReview {
  const { handle, scope, revision, workloadDigest, now } = context;
  if (typeof handle !== 'string' || !handlePattern.test(handle) || typeof scope !== 'string' || !scopePattern.test(scope) || typeof revision !== 'string' || !sha.test(revision) || typeof workloadDigest !== 'string' || !digest.test(workloadDigest) || !timestamp(now)) throw new Error('invalid benchmark context');
  if (input === null) return { state: 'not_measured', summary: null };
  const batch = snapshot(input);
  const summary = summarizeBenchmark(batch)!;
  if (summary.source === 'fixture') return { state: 'fixture', summary };
  const measurementDigest = benchmarkMeasurementDigest(batch);
  try {
    const receipt = record(resolve(handle));
    const { observedAt, expiresAt } = receipt;
    if (receipt.handle === handle && receipt.scope === scope && receipt.revision === revision && receipt.workloadDigest === workloadDigest && receipt.provider === summary.provider && receipt.source === 'local' && receipt.measurementDigest === measurementDigest && receipt.exitCode === 0 && timestamp(observedAt) && timestamp(expiresAt) && observedAt <= now && now < expiresAt && expiresAt - observedAt <= maxAgeMs) return { state: 'receipt_matched', summary };
  } catch { /* never expose private receipt or lookup errors */ }
  return { state: 'unverified', summary: null };
}
