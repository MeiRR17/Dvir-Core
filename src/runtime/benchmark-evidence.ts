import { createHash } from 'node:crypto';
import { summarizeBenchmark, type BenchmarkSummary } from './benchmark.ts';

export type BenchmarkExecutionIdentity = Readonly<{
  modelDigest: string;
  quantization: string;
  contextTokens: number;
  kvCacheDigest: string;
  runtimeVersion: string;
  hostDigest: string;
}>;
export type BenchmarkContext = Readonly<{ handle: string; scope: string; revision: string; workloadDigest: string; executionDigest: string; now: number }>;
export type BenchmarkReview = { state: 'not_measured' | 'unverified'; summary: null } | { state: 'fixture' | 'receipt_matched'; summary: BenchmarkSummary };
const maxAgeMs = 24 * 60 * 60 * 1000;
const handlePattern = /^benchmark:[a-zA-Z0-9_-]{1,80}$/;
const scopePattern = /^[a-zA-Z0-9_-]{1,80}$/;
const sha = /^[a-f0-9]{40}$/;
const digest = /^[a-f0-9]{64}$/;
const quantizationPattern = /^[a-zA-Z0-9._+-]{1,64}$/;
const runtimePattern = /^[a-zA-Z0-9._+-]{1,128}$/;

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

// Hash private execution identity. Raw model, quantization, runtime and host details
// never enter the public summary or receipt handle. Inputs must come from the trusted
// local runner/configuration, not from an untrusted benchmark request.
export function benchmarkExecutionFingerprint(identity: BenchmarkExecutionIdentity): string {
  const value = record(identity);
  if (typeof value.modelDigest !== 'string' || !digest.test(value.modelDigest) ||
      typeof value.kvCacheDigest !== 'string' || !digest.test(value.kvCacheDigest) ||
      typeof value.hostDigest !== 'string' || !digest.test(value.hostDigest) ||
      typeof value.quantization !== 'string' || !quantizationPattern.test(value.quantization) ||
      typeof value.contextTokens !== 'number' || !Number.isSafeInteger(value.contextTokens) || value.contextTokens < 1 || value.contextTokens > 1048576 ||
      typeof value.runtimeVersion !== 'string' || !runtimePattern.test(value.runtimeVersion)) throw new Error('invalid benchmark execution identity');
  const canonical = {
    modelDigest: value.modelDigest,
    quantization: value.quantization,
    contextTokens: value.contextTokens,
    kvCacheDigest: value.kvCacheDigest,
    runtimeVersion: value.runtimeVersion,
    hostDigest: value.hostDigest,
  };
  return createHash('sha256').update('dvir-core:benchmark-execution:v1\\0').update(JSON.stringify(canonical)).digest('hex');
}

// Private measurement digest, not an authentication credential or a public report field.
// Hash ordered validated samples, not just their potentially colliding aggregates.
export function benchmarkMeasurementDigest(input: unknown): string {
  const batch = snapshot(input);
  summarizeBenchmark(batch);
  return createHash('sha256').update('dvir-core:benchmark:v1\\0').update(JSON.stringify(batch)).digest('hex');
}
function timestamp(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}
// Trusted caller must authorize scope/workload and supply an authenticated private
// receipt resolver. A matching receipt is not independent proof of actual inference.
export function reviewBenchmark(input: unknown, context: BenchmarkContext, resolve: (handle: string) => unknown): BenchmarkReview {
  const { handle, scope, revision, workloadDigest, executionDigest, now } = context;
  if (typeof handle !== 'string' || !handlePattern.test(handle) || typeof scope !== 'string' || !scopePattern.test(scope) ||
      typeof revision !== 'string' || !sha.test(revision) || typeof workloadDigest !== 'string' || !digest.test(workloadDigest) ||
      typeof executionDigest !== 'string' || !digest.test(executionDigest) || !timestamp(now)) throw new Error('invalid benchmark context');
  if (input === null) return { state: 'not_measured', summary: null };
  const batch = snapshot(input);
  const summary = summarizeBenchmark(batch)!;
  if (summary.source === 'fixture') return { state: 'fixture', summary };
  const measurementDigest = benchmarkMeasurementDigest(batch);
  try {
    const receipt = record(resolve(handle));
    const { observedAt, expiresAt } = receipt;
    if (receipt.handle === handle && receipt.scope === scope && receipt.revision === revision && receipt.workloadDigest === workloadDigest &&
        receipt.executionDigest === executionDigest && receipt.provider === summary.provider && receipt.source === 'local' &&
        receipt.measurementDigest === measurementDigest && receipt.exitCode === 0 && timestamp(observedAt) &&
        timestamp(expiresAt) && observedAt <= now && now < expiresAt && expiresAt - observedAt <= maxAgeMs) return { state: 'receipt_matched', summary };
  } catch { /* never expose private receipt or lookup errors */ }
  return { state: 'unverified', summary: null };
}
