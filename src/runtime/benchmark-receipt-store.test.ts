import { createHmac } from 'node:crypto';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AuthenticatedStoreWriteError } from '../storage/authenticated-json-file-store.ts';
import { chmodSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openBenchmarkReceiptStore, type BenchmarkReceipt, writeBenchmarkReceiptOnce } from './benchmark-receipt-store.ts';
const key = Buffer.alloc(32, 1);
const receipt: BenchmarkReceipt = { handle: 'benchmark:run', scope: 'core', revision: 'a'.repeat(40), workloadDigest: 'b'.repeat(64), executionDigest: 'd'.repeat(64), provider: 'mlx', source: 'local', measurementDigest: 'c'.repeat(64), exitCode: 0, observedAt: 900, expiresAt: 1100 };
function fixture(run: (root: string) => void) { const root = mkdtempSync(join(tmpdir(), 'bench-store-')); try { run(root); } finally { rmSync(root, { recursive: true, force: true }); } }
const open = (root: string) => openBenchmarkReceiptStore(root, 'core', key);
test('reads existing v0.0.18 HMAC envelope without migration', () => fixture(root => {
  const payload = JSON.stringify(receipt);
  const mac = createHmac('sha256', key).update('dvir-core:benchmark-receipt:v1\\0').update(payload).digest('hex');
  writeFileSync(join(root, 'run.json'), JSON.stringify({ version: 1, payload, mac }), { mode: 0o600 });
  assert.deepEqual(open(root).read(receipt.handle, 1000), receipt);
}));
test('persist, reopen, private mode and no temporary artifacts', () => fixture(root => {
  open(root).put(receipt, 1000); assert.deepEqual(open(root).read(receipt.handle, 1000), receipt);
  assert.deepEqual(readdirSync(root), ['run.json']); assert.equal(statSync(join(root, 'run.json')).mode & 0o777, 0o600);
}));
test('wrong key and wrong scope denied', () => fixture(root => {
  open(root).put(receipt, 1000);
  assert.equal(openBenchmarkReceiptStore(root, 'core', Buffer.alloc(32, 2)).read(receipt.handle, 1000), undefined);
  assert.equal(openBenchmarkReceiptStore(root, 'other', key).read(receipt.handle, 1000), undefined);
}));
test('tampered payload denied', () => fixture(root => {
  open(root).put(receipt, 1000); const path = join(root, 'run.json');
  const env = JSON.parse(readFileSync(path, 'utf8')); env.payload = env.payload.replace('mlx', 'ollama'); writeFileSync(path, JSON.stringify(env));
  assert.equal(open(root).read(receipt.handle, 1000), undefined);
}));
test('expired, future, absent and invalid handles denied', () => fixture(root => {
  const s = open(root); s.put(receipt, 1000);
  for (const [handle, now] of [[receipt.handle, 1100], [receipt.handle, 899], ['benchmark:missing', 1000], ['benchmark:../run', 1000], [receipt.handle, NaN]] as const) assert.equal(s.read(handle, now), undefined);
}));
test('immutable duplicate publication', () => fixture(root => {
  const s = open(root); s.put(receipt, 1000); assert.throws(() => s.put({ ...receipt, provider: 'ollama' }, 1000));
  assert.deepEqual(s.read(receipt.handle, 1000), receipt); assert.deepEqual(readdirSync(root), ['run.json']);
}));
test('invalid or out-of-scope writes rejected before publication', () => fixture(root => {
  const s = open(root);
  for (const delta of [{ scope: 'other' }, { observedAt: 1001 }, { expiresAt: 1000 }, { expiresAt: 900 + 86400001 }, { source: 'fixture' }, { exitCode: 1 }, { measurementDigest: 'bad' }, { executionDigest: 'bad' }, { handle: 'benchmark:../bad' }]) assert.throws(() => s.put({ ...receipt, ...delta } as BenchmarkReceipt, 1000));
  assert.deepEqual(readdirSync(root), []);
}));
test('symlink and overlarge file denied', () => fixture(root => {
  const s = open(root); s.put(receipt, 1000); symlinkSync(join(root, 'run.json'), join(root, 'alias.json'));
  assert.equal(s.read('benchmark:alias', 1000), undefined);
  writeFileSync(join(root, 'large.json'), Buffer.alloc(4097), { mode: 0o600 }); assert.equal(s.read('benchmark:large', 1000), undefined);
}));
test('unsafe permissions denied on read and open', () => fixture(root => {
  const s = open(root); s.put(receipt, 1000); chmodSync(join(root, 'run.json'), 0o644); assert.equal(s.read(receipt.handle, 1000), undefined);
  chmodSync(root, 0o755); assert.throws(() => open(root), /unsafe/); assert.equal(s.read(receipt.handle, 1000), undefined); chmodSync(root, 0o700);
}));
test('key snapshot and strict configuration', () => fixture(root => {
  const secret = Buffer.alloc(32, 1); const s = openBenchmarkReceiptStore(root, 'core', secret); secret.fill(9); s.put(receipt, 1000); assert.deepEqual(open(root).read(receipt.handle, 1000), receipt);
  assert.throws(() => openBenchmarkReceiptStore(root, 'core', Buffer.alloc(31))); assert.throws(() => open('relative'));
}));
test('ambiguous publication is read once and never retried', () => {
  let writes = 0, reads = 0;
  const fake = {
    put() { writes++; throw new AuthenticatedStoreWriteError('published_unconfirmed'); },
    read() { reads++; return receipt; },
  };
  assert.equal(writeBenchmarkReceiptOnce(fake, receipt, 1000), 'published_unconfirmed');
  assert.equal(writes, 1); assert.equal(reads, 1);
});
test('mismatched or absent readback remains unconfirmed without retry', () => {
  let writes = 0, reads = 0;
  const fake = {
    put() { writes++; throw new AuthenticatedStoreWriteError('published_unconfirmed'); },
    read() { reads++; return { ...receipt, executionDigest: 'f'.repeat(64) }; },
  };
  assert.equal(writeBenchmarkReceiptOnce(fake, receipt, 1000), 'unconfirmed');
  assert.equal(writes, 1); assert.equal(reads, 1);
});
test('matching duplicate after pre-publication error is visibility only', () => {
  const fake = {
    put() { throw new AuthenticatedStoreWriteError('not_published'); },
    read() { return receipt; },
  };
  assert.equal(writeBenchmarkReceiptOnce(fake, receipt, 1000), 'observed_after_error');
});
