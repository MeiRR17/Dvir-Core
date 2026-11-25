import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, readdirSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { benchmarkMeasurementDigest } from './benchmark-evidence.ts';
import { openBenchmarkReceiptStore, type BenchmarkReceipt } from './benchmark-receipt-store.ts';
import { reviewStoredBenchmark } from './stored-benchmark-review.ts';
const row = { firstTokenMs: 100, decodeMs: 2000, completionTokens: 20, peakProcessBytes: null, structuredSuccess: true, toolSuccess: null };
const batch = { provider: 'mlx', source: 'local', samples: [row] };
const ctx = { handle: 'benchmark:run', scope: 'core', revision: 'a'.repeat(40), workloadDigest: 'b'.repeat(64), now: 1000 };
const key = Buffer.alloc(32, 7);
const receipt: BenchmarkReceipt = { handle: ctx.handle, scope: ctx.scope, revision: ctx.revision, workloadDigest: ctx.workloadDigest, provider: 'mlx', source: 'local', measurementDigest: benchmarkMeasurementDigest(batch), exitCode: 0, observedAt: 900, expiresAt: 1100 };
const denied = { state: 'unverified', summary: null };
const storage = (directory: string) => ({ directory, scope: 'core', secret: key });
function fixture(run: (root: string) => void) { const root = mkdtempSync(join(tmpdir(), 'stored-bench-')); try { run(root); } finally { rmSync(root, { recursive: true, force: true }); } }
const publish = (root: string) => openBenchmarkReceiptStore(root, 'core', key).put(receipt, 1000);
test('reopen authenticated receipt yields aggregate only', () => fixture(root => {
  publish(root); const result = reviewStoredBenchmark(batch, ctx, storage(root));
  assert.equal(result.state, 'receipt_matched'); assert.equal(result.summary?.medianTokensPerSecond, 10);
  assert.doesNotMatch(JSON.stringify(result), /benchmark:run|measurementDigest|workloadDigest/);
}));
test('fixture and unmeasured inputs never touch storage', () => {
  const inaccessible = new Proxy(storage('/missing'), { get() { throw new Error('must not access storage'); } });
  assert.equal(reviewStoredBenchmark(null, ctx, inaccessible).state, 'not_measured');
  assert.equal(reviewStoredBenchmark({ ...batch, source: 'fixture' }, ctx, inaccessible).state, 'fixture');
});
test('missing store, missing receipt, wrong scope and key fail closed', () => fixture(root => {
  assert.deepEqual(reviewStoredBenchmark(batch, ctx, storage(join(root, 'missing'))), denied);
  assert.deepEqual(reviewStoredBenchmark(batch, ctx, storage(root)), denied); publish(root);
  assert.deepEqual(reviewStoredBenchmark(batch, ctx, { ...storage(root), scope: 'other' }), denied);
  assert.deepEqual(reviewStoredBenchmark(batch, ctx, { ...storage(root), secret: Buffer.alloc(32, 8) }), denied);
}));
test('expired receipt, wrong revision or changed measurement rejected', () => fixture(root => {
  publish(root);
  assert.deepEqual(reviewStoredBenchmark(batch, { ...ctx, now: 1100 }, storage(root)), denied);
  assert.deepEqual(reviewStoredBenchmark(batch, { ...ctx, revision: 'c'.repeat(40) }, storage(root)), denied);
  assert.deepEqual(reviewStoredBenchmark({ ...batch, samples: [{ ...row, firstTokenMs: 200 }] }, ctx, storage(root)), denied);
}));
test('tampered receipt fails closed', () => fixture(root => {
  publish(root); const path = join(root, 'run.json'); const env = JSON.parse(readFileSync(path, 'utf8'));
  env.payload = env.payload.replace('mlx', 'ollama'); writeFileSync(path, JSON.stringify(env));
  assert.deepEqual(reviewStoredBenchmark(batch, ctx, storage(root)), denied);
}));
test('orphaned temporary file is ignored without deleting it', () => fixture(root => {
  const orphan = '.tmp-' + 'a'.repeat(32); writeFileSync(join(root, orphan), 'incomplete', { mode: 0o600 });
  assert.deepEqual(reviewStoredBenchmark(batch, ctx, storage(root)), denied); publish(root);
  assert.equal(reviewStoredBenchmark(batch, ctx, storage(root)).state, 'receipt_matched');
  assert.deepEqual(readdirSync(root).sort(), [orphan, 'run.json']);
}));
test('unsafe store permissions fail closed', () => fixture(root => {
  publish(root); chmodSync(root, 0o755);
  assert.deepEqual(reviewStoredBenchmark(batch, ctx, storage(root)), denied); chmodSync(root, 0o700);
}));
test('malformed input still rejected before storage access', () => {
  assert.throws(() => reviewStoredBenchmark({ ...batch, samples: [] }, ctx, storage('/missing')), /invalid benchmark/);
});
