import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, mkdtempSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openAuthenticatedJsonFileStore } from './authenticated-json-file-store.ts';
const key = Buffer.alloc(32, 3);
function fixture(run: (root: string) => void) { const root = mkdtempSync(join(tmpdir(), 'auth-json-')); try { run(root); } finally { chmodSync(root, 0o700); rmSync(root, { recursive: true, force: true }); } }
test('round trip and immutable publication', () => fixture(root => {
  const store = openAuthenticatedJsonFileStore(root, key, 'test-domain:v1\0', 4096);
  store.write('one.json', '{"value":1}');
  assert.equal(store.read('one.json'), '{"value":1}');
  assert.throws(() => store.write('one.json', '{"value":2}'));
  assert.deepEqual(readdirSync(root), ['one.json']);
}));
test('domain separation rejects otherwise identical envelopes', () => fixture(root => {
  openAuthenticatedJsonFileStore(root, key, 'domain-a\0', 4096).write('one.json', 'payload');
  assert.equal(openAuthenticatedJsonFileStore(root, key, 'domain-b\0', 4096).read('one.json'), undefined);
}));
test('unsafe names, malformed envelopes, symlinks and oversized files fail closed', () => fixture(root => {
  const store = openAuthenticatedJsonFileStore(root, key, 'test-domain:v1\0', 4096);
  assert.throws(() => store.write('../one.json', 'x'));
  assert.equal(store.read('../one.json'), undefined);
  writeFileSync(join(root, 'bad.json'), '{'); assert.equal(store.read('bad.json'), undefined);
  symlinkSync(join(root, 'bad.json'), join(root, 'link.json')); assert.equal(store.read('link.json'), undefined);
  writeFileSync(join(root, 'large.json'), Buffer.alloc(4097), { mode: 0o600 }); assert.equal(store.read('large.json'), undefined);
}));
test('bad directory permissions and configuration rejected', () => fixture(root => {
  chmodSync(root, 0o755); assert.throws(() => openAuthenticatedJsonFileStore(root, key, 'domain', 4096), /unsafe/); chmodSync(root, 0o700);
  assert.throws(() => openAuthenticatedJsonFileStore('relative', key, 'domain', 4096));
  assert.throws(() => openAuthenticatedJsonFileStore(root, Buffer.alloc(31), 'domain', 4096));
  assert.throws(() => openAuthenticatedJsonFileStore(root, key, '', 4096));
  assert.throws(() => openAuthenticatedJsonFileStore(root, key, 'domain', 100000));
}));
test('caller-owned secret is snapshotted', () => fixture(root => {
  const secret = Buffer.alloc(32, 9); const store = openAuthenticatedJsonFileStore(root, secret, 'domain', 4096); secret.fill(0);
  store.write('one.json', 'stable'); assert.equal(store.read('one.json'), 'stable');
}));
