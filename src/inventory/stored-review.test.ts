import { strict as assert } from 'node:assert';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, chmodSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { openReceiptStore, type Receipt } from './receipt-store.ts';
import { reviewStoredInventory } from './stored-review.ts';
import type { Review } from './decisions.ts';

const revision = 'a'.repeat(40);
const rows = [1, 2].map(id => ({id, owner:{login:'fixture'}, archived:id===2, visibility:'private'}));
const pages = [{offset:0,repositories:rows},{offset:2,repositories:[]}];
const reviews: Review[] = [{id:'1',decision:'adopt',evidence:'receipt:one'},{id:'2',decision:'defer',evidence:'receipt:two'}];
const one: Receipt = {handle:'receipt:one', owner:'fixture', repositoryId:'1', decision:'adopt', revision, observedAt:10, expiresAt:30};
const two: Receipt = {...one, handle:'receipt:two', repositoryId:'2', decision:'defer'};
function fixture(run: (dir: string, key: Uint8Array) => void): void {
  const dir = mkdtempSync(join(tmpdir(),'core-stored-review-'));
  try { run(dir,Buffer.alloc(32,7)); } finally { chmodSync(dir,0o700); rmSync(dir,{recursive:true,force:true}); }
}
function read(dir:string,key:Uint8Array,now=20,rev=revision,input=pages,choices=reviews) {
  return reviewStoredInventory({directory:dir,owner:'fixture',secret:key,maxAgeMs:20},input,2,choices,now,rev);
}
test('persistent evidence resolves after reopen',()=>fixture((dir,key)=>{
  const store=openReceiptStore(dir,'fixture',key,20); store.put(one,20); store.put(two,20);
  assert.deepEqual(read(dir,key),{summary:{repositories:2,archived:1,active:1,adopt:1,defer:1,not_applicable:0,unknown:0,complete:true},unresolved:0});
}));
test('missing evidence preserves partial decisions',()=>fixture((dir,key)=>{
  openReceiptStore(dir,'fixture',key,20).put(one,20);
  const result=read(dir,key); assert.equal(result.summary.adopt,1); assert.equal(result.summary.unknown,1); assert.equal(result.unresolved,1); assert.equal(result.summary.complete,false);
}));
test('tampering fails closed, other receipt remains valid',()=>fixture((dir,key)=>{
  const store=openReceiptStore(dir,'fixture',key,20); store.put(one,20); store.put(two,20);
  const path=join(dir,'one.json'); writeFileSync(path,readFileSync(path,'utf8').replace('adopt','defer'));
  const result=read(dir,key); assert.equal(result.summary.adopt,0); assert.equal(result.summary.defer,1); assert.equal(result.unresolved,1);
}));
test('wrong key, expired receipts and different audit revision deny',()=>fixture((dir,key)=>{
  const store=openReceiptStore(dir,'fixture',key,20); store.put(one,20); store.put(two,20);
  for(const result of [read(dir,Buffer.alloc(32,8)),read(dir,key,30),read(dir,key,20,'b'.repeat(40))]) { assert.equal(result.unresolved,2); assert.equal(result.summary.complete,false); }
}));
test('incomplete enumeration cannot become complete',()=>fixture((dir,key)=>{
  const store=openReceiptStore(dir,'fixture',key,20); store.put(one,20); store.put(two,20);
  assert.equal(read(dir,key,20,revision,pages.slice(0,1)).summary.complete,false);
}));
test('duplicate retry keeps original evidence',()=>fixture((dir,key)=>{
  const store=openReceiptStore(dir,'fixture',key,20); store.put(one,20); store.put(two,20);
  assert.throws(()=>store.put({...one,decision:'defer'},20)); assert.equal(read(dir,key).summary.complete,true);
}));
test('invalid scope and invalid configuration reject',()=>fixture((dir,key)=>{
  assert.throws(()=>read(dir,key,20,revision,[{offset:0,repositories:[{...rows[0],owner:{login:'other'}}]}],[]));
  assert.throws(()=>read(dir,key,20,'invalid'));
}));
test('unsafe directory rejects and output contains no receipt handles',()=>fixture((dir,key)=>{
  openReceiptStore(dir,'fixture',key,20).put(one,20);
  assert.equal(JSON.stringify(read(dir,key)).includes('receipt:'),false);
  chmodSync(dir,0o755); assert.throws(()=>read(dir,key));
}));
