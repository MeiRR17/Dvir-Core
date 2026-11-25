import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { mkdtempSync, rmSync, readFileSync, writeFileSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openReceiptStore, type Receipt } from './receipt-store.ts';
import { runStoredInventoryReview } from './stored-pipeline.ts';
import type { ConnectorCall } from './github-reader.ts';
import type { Review } from './decisions.ts';
const options = { owner: 'fixture', pageSize: 2, maxPages: 4, deadlineMs: 1000, now: 20, revision: 'a'.repeat(40) };
const receipt: Receipt = { handle: 'receipt:one', owner: 'fixture', repositoryId: '1', decision: 'adopt', revision: options.revision, observedAt: 10, expiresAt: 30 };
const reviews: Review[] = [{ id: '1', decision: 'adopt', evidence: receipt.handle }];
const provider: ConnectorCall = async args => ({ result: { repositories: args.page_offset ? [] : [{ id: '1', owner: { login: 'fixture' }, visibility: 'private', archived: false, name: 'private-fixture' }] } });
async function fixture(run: (directory: string, secret: Uint8Array) => Promise<void>) {
  const directory = mkdtempSync(join(tmpdir(), 'core-pipeline-'));
  try { await run(directory, Buffer.alloc(32, 7)); }
  finally { chmodSync(directory, 0o700); rmSync(directory, { recursive: true, force: true }); }
}
test('complete live-shaped fixture reads persisted signed receipt', () => fixture(async (directory, secret) => {
  openReceiptStore(directory, options.owner, secret, 20).put(receipt, 20);
  const result = await runStoredInventoryReview(options, { directory, secret, maxAgeMs: 20 }, provider, reviews);
  assert.equal(result.status, 'complete'); assert.equal(result.review?.summary.adopt, 1);
  assert.doesNotMatch(JSON.stringify(result), /receipt:|private-fixture/);
}));
test('missing, expired, wrong-key and wrong-revision receipts stay unresolved', () => fixture(async (directory, secret) => {
  const config = { directory, secret, maxAgeMs: 20 };
  assert.equal((await runStoredInventoryReview(options, config, provider, reviews)).status, 'incomplete_review');
  openReceiptStore(directory, options.owner, secret, 20).put(receipt, 20);
  for (const [o, c] of [[{ ...options, now: 30 }, config], [options, { ...config, secret: Buffer.alloc(32, 8) }], [{ ...options, revision: 'b'.repeat(40) }, config]] as const) {
    const result = await runStoredInventoryReview(o, c, provider, reviews);
    assert.equal(result.status, 'incomplete_review'); assert.equal(result.review?.unresolved, 1);
  }
}));
test('modified persisted receipt fails verification', () => fixture(async (directory, secret) => {
  openReceiptStore(directory, options.owner, secret, 20).put(receipt, 20);
  const file = join(directory, 'one.json');
  writeFileSync(file, readFileSync(file, 'utf8').replace('adopt', 'defer'));
  assert.equal((await runStoredInventoryReview(options, { directory, secret, maxAgeMs: 20 }, provider, reviews)).review?.unresolved, 1);
}));
test('partial inventory cannot produce a verified review', () => fixture(async (directory, secret) => {
  openReceiptStore(directory, options.owner, secret, 20).put(receipt, 20);
  const result = await runStoredInventoryReview({ ...options, maxPages: 1 }, { directory, secret, maxAgeMs: 20 }, provider, reviews);
  assert.equal(result.status, 'incomplete_inventory'); assert.equal(result.review, null);
}));
test('unsafe store fails before contacting provider', () => fixture(async (directory, secret) => {
  chmodSync(directory, 0o755); let calls = 0;
  await assert.rejects(runStoredInventoryReview(options, { directory, secret, maxAgeMs: 20 }, async () => { calls++; return {}; }, reviews));
  assert.equal(calls, 0);
}));
