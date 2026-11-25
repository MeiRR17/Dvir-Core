import assert from 'node:assert/strict';
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { openReceiptStore, type Receipt } from './receipt-store.ts';
import { writeReceiptOnce } from './receipt-recovery.ts';
const receipt: Receipt = {handle:'receipt:one',owner:'fixture',repositoryId:'1',decision:'adopt',revision:'a'.repeat(40),observedAt:10,expiresAt:30};
function fixture(run: (dir: string, key: Uint8Array) => void) {
  const dir = fs.mkdtempSync(join(tmpdir(),'core-recovery-'));
  try { run(dir, Buffer.alloc(32,7)); } finally { fs.rmSync(dir,{recursive:true,force:true}); }
}
// Inject exactly one fsync failure, restore builtin exports even on assertion failure.
function failSync(at: number, run: () => void) {
  const original = fs.fsyncSync;
  let calls = 0;
  fs.fsyncSync = fd => { if (++calls === at) throw new Error('synthetic fsync failure'); original(fd); };
  syncBuiltinESMExports();
  try { run(); assert.equal(calls, at); }
  finally { fs.fsyncSync = original; syncBuiltinESMExports(); }
}
test('ordinary write and exact duplicate observation', () => fixture((dir,key) => {
  const store = openReceiptStore(dir,'fixture',key,20);
  assert.equal(writeReceiptOnce(store,receipt,20),'written');
  assert.equal(writeReceiptOnce(store,receipt,20),'observed_after_error');
  assert.deepEqual(store.read(receipt.handle,20),receipt);
}));
test('file fsync failure occurs before publication', () => fixture((dir,key) => {
  const store = openReceiptStore(dir,'fixture',key,20);
  failSync(1, () => assert.equal(writeReceiptOnce(store,receipt,20),'unconfirmed'));
  assert.equal(store.read(receipt.handle,20),undefined);
  assert.deepEqual(fs.readdirSync(dir),[]);
  assert.equal(writeReceiptOnce(store,receipt,20),'written');
}));
test('directory fsync failure after publication only proves visibility', () => fixture((dir,key) => {
  const store = openReceiptStore(dir,'fixture',key,20);
  failSync(2, () => assert.equal(writeReceiptOnce(store,receipt,20),'observed_after_error'));
  assert.deepEqual(openReceiptStore(dir,'fixture',key,20).read(receipt.handle,20),receipt);
  assert.deepEqual(fs.readdirSync(dir),['one.json']);
}));
test('conflicting retry cannot replace original', () => fixture((dir,key) => {
  const store = openReceiptStore(dir,'fixture',key,20);
  store.put(receipt,20);
  assert.equal(writeReceiptOnce(store,{...receipt,decision:'defer'},20),'unconfirmed');
  assert.deepEqual(store.read(receipt.handle,20),receipt);
}));
test('expired and wrong-owner evidence stays unconfirmed', () => fixture((dir,key) => {
  const store = openReceiptStore(dir,'fixture',key,20);
  store.put(receipt,20);
  assert.equal(writeReceiptOnce(store,receipt,30),'unconfirmed');
  assert.equal(writeReceiptOnce(store,{...receipt,owner:'other'},20),'unconfirmed');
}));
test('read failure is sanitized; no retry', () => {
  let writes=0, reads=0;
  const store={put(){writes++;throw new Error('private write');},read(){reads++;throw new Error('private read');}};
  assert.equal(writeReceiptOnce(store,receipt,20),'unconfirmed');
  assert.equal(writes,1); assert.equal(reads,1);
});
