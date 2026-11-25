import { test } from 'node:test';
import assert from 'node:assert/strict';
import { summarizeOllamaInventory as summarize } from './ollama-inventory.ts';
const digest = 'a'.repeat(64);
const row = (name = 'private-model', hash = digest, size = 100, size_vram = 20) => ({ name, digest: hash, size, size_vram, secret: 'private-fixture' });
const envelope = (...models: unknown[]) => ({ models });
test('unobserved and observed-empty are different', () => {
  assert.deepEqual(summarize(null, null), {provider:'ollama',listed:null,running:null,benchmark:'not_measured'});
  assert.deepEqual(summarize(envelope(), envelope()).running, {entries:0,distinctDigests:0,reportedBytes:0,reportedVramBytes:0,unmatchedDigests:0});
});
test('alias counts are distinct from digest counts', () => {
  assert.deepEqual(summarize(envelope(row(),row('alias')),envelope(row())).listed,{entries:2,distinctDigests:1,reportedBytes:200});
});
test('running-only digest is a mismatch, not proof of failure', () => {
  assert.equal(summarize(envelope(row()),envelope(row('other','b'.repeat(64)))).running?.unmatchedDigests,1);
});
test('missing tags cannot establish mismatch', () => {
  assert.equal(summarize(null,envelope(row())).running?.unmatchedDigests,null);
});
test('aggregates provider-reported sizes only', () => {
  assert.deepEqual(summarize(envelope(row()),envelope(row())).running,{entries:1,distinctDigests:1,reportedBytes:100,reportedVramBytes:20,unmatchedDigests:0});
});
test('raw identities and metadata do not escape', () => {
  assert.doesNotMatch(JSON.stringify(summarize(envelope(row()),envelope(row()))),/private-|aaaaaaaa/);
});
test('duplicate name rejected', () => { assert.throws(()=>summarize(envelope(row(),row()),null),/invalid model identity/); });
test('invalid digest and blank name rejected', () => { for(const r of [row('','a'.repeat(64)),row('fixture','bad')])assert.throws(()=>summarize(envelope(r),null)); });
test('malformed and oversized envelope rejected', () => { for(const value of [{},[],envelope(...Array.from({length:1001},(_,i)=>row(String(i))))])assert.throws(()=>summarize(value,null)); });
test('invalid sizes and missing running VRAM rejected', () => { for(const size of [-1,1.5,Infinity,Number.MAX_SAFE_INTEGER+1])assert.throws(()=>summarize(envelope(row('fixture',digest,size)),null)); assert.throws(()=>summarize(null,envelope({name:'fixture',digest,size:1}))); });
test('unsafe aggregate sum rejected', () => { assert.throws(()=>summarize(envelope(row('one',digest,Number.MAX_SAFE_INTEGER),row('two',digest,1)),null),/overflow/); });
test('no benchmark can be inferred from inventory', () => { assert.equal(summarize(envelope(row()),envelope(row())).benchmark,'not_measured'); });
