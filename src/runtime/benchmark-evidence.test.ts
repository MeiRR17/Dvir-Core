import { test } from 'node:test';
import assert from 'node:assert/strict';
import { benchmarkMeasurementDigest, reviewBenchmark } from './benchmark-evidence.ts';
const row = { firstTokenMs: 100, decodeMs: 2000, completionTokens: 20, peakProcessBytes: null, structuredSuccess: true, toolSuccess: null };
const batch = { provider: 'mlx', source: 'local', samples: [row, { ...row, firstTokenMs: 300 }] };
const ctx = { handle: 'benchmark:private_run', scope: 'core', revision: 'a'.repeat(40), workloadDigest: 'b'.repeat(64), now: 1000 };
const receipt = { handle: ctx.handle, scope: ctx.scope, revision: ctx.revision, workloadDigest: ctx.workloadDigest, provider: 'mlx', source: 'local', measurementDigest: benchmarkMeasurementDigest(batch), exitCode: 0, observedAt: 900, expiresAt: 1100 };
const deny = { state: 'unverified', summary: null };
test('unobserved and fixtures never consult private resolver', () => {
  let calls = 0; const read = () => { calls++; return receipt; };
  assert.equal(reviewBenchmark(null, ctx, read).state, 'not_measured');
  assert.equal(reviewBenchmark({ ...batch, source: 'fixture' }, ctx, read).state, 'fixture'); assert.equal(calls, 0);
});
test('matching receipt returns aggregate only', () => {
  const result = reviewBenchmark(batch, ctx, handle => { assert.equal(handle, ctx.handle); return { ...receipt, privatePrompt: 'secret' }; });
  assert.equal(result.state, 'receipt_matched'); assert.equal(result.summary?.medianFirstTokenMs, 200);
  assert.doesNotMatch(JSON.stringify(result), /secret|private_run|measurementDigest|workloadDigest/);
});
test('same aggregate, different sample ordering or values cannot match', () => {
  for (const samples of [[...batch.samples].reverse(), [{ ...row, firstTokenMs: 150 }, { ...row, firstTokenMs: 250 }]]) assert.deepEqual(reviewBenchmark({ ...batch, samples }, ctx, () => receipt), deny);
});
test('canonical field order and unrelated private fields ignored', () => {
  const changed = { ...batch, samples: batch.samples.map(r => ({ privateModel: 'secret', ...Object.fromEntries(Object.entries(r).reverse()) })) };
  assert.equal(benchmarkMeasurementDigest(changed), receipt.measurementDigest);
});
test('scope, revision, workload, provider, source and exit must match', () => {
  for (const delta of [{ handle: 'benchmark:other' }, { scope: 'other' }, { revision: 'c'.repeat(40) }, { workloadDigest: 'c'.repeat(64) }, { provider: 'ollama' }, { source: 'fixture' }, { exitCode: 1 }, { measurementDigest: 'c'.repeat(64) }]) assert.deepEqual(reviewBenchmark(batch, ctx, () => ({ ...receipt, ...delta })), deny);
});
test('missing, malformed, future, expired or too-long receipt rejected', () => {
  for (const r of [null, [], {}, { ...receipt, observedAt: 1001 }, { ...receipt, expiresAt: 1000 }, { ...receipt, expiresAt: 900 + 86400001 }, { ...receipt, observedAt: -1 }, { ...receipt, expiresAt: Infinity }]) assert.deepEqual(reviewBenchmark(batch, ctx, () => r), deny);
});
test('private read errors fail closed', () => assert.deepEqual(reviewBenchmark(batch, ctx, () => { throw new Error('secret'); }), deny));
test('malformed inputs and context rejected before lookup', () => {
  let calls = 0; const read = () => { calls++; return receipt; };
  for (const input of [{ ...batch, samples: [] }, { ...batch, samples: Array(101).fill(row) }, { ...batch, samples: Array(1) }, { ...batch, samples: [{ ...row, decodeMs: 0 }] }]) assert.throws(() => reviewBenchmark(input, ctx, read), /invalid benchmark/);
  for (const delta of [{ handle: 'wrong' }, { scope: '' }, { revision: 'wrong' }, { workloadDigest: 'wrong' }, { now: NaN }]) assert.throws(() => reviewBenchmark(batch, { ...ctx, ...delta }, read), /invalid benchmark context/);
  assert.equal(calls, 0);
});
