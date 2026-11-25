import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openReceiptStore } from './receipt-store.ts';
import { prepareAuditBatch, boundReceiptReader } from './receipt-binding.ts';
import type { RetentionApproval } from './receipt-provision.ts';
const approval: RetentionApproval={owner:'fixture',revision:'a'.repeat(40),approvalId:'fixture',approvedAt:10,expiresAt:40,maxAgeMs:20,repositoryIds:['1']};
const evidence=Buffer.from('synthetic evidence');
const sourceSha='b'.repeat(40);
const prepared=prepareAuditBatch(approval,[{owner:'fixture',repositoryId:'1',decision:'adopt',sourceSha,observedAt:12,evidence}],20)[0];
function fixture(run:(dir:string,key:Uint8Array)=>void){const dir=mkdtempSync(join(tmpdir(),'core-prepared-'));try{run(dir,Buffer.alloc(32,7));}finally{rmSync(dir,{recursive:true,force:true});}}
test('atomic prepared record survives reopen; legacy read excludes binding',()=>fixture((dir,key)=>{
  openReceiptStore(dir,'fixture',key,20).putPrepared(prepared,20);
  const store=openReceiptStore(dir,'fixture',key,20);
  assert.deepEqual(store.readPrepared(prepared.receipt.handle,20),prepared);
  assert.deepEqual(store.read(prepared.receipt.handle,20),prepared.receipt);
  assert.equal(store.readPrepared(prepared.receipt.handle,32),undefined);
}));
test('legacy receipt does not resolve as prepared',()=>fixture((dir,key)=>{
  const store=openReceiptStore(dir,'fixture',key,20);store.put(prepared.receipt,20);
  assert.equal(store.readPrepared(prepared.receipt.handle,20),undefined);
  assert.throws(()=>store.putPrepared(prepared,20));
}));
test('binding changes or missing binding reject before publication',()=>fixture((dir,key)=>{
  const store=openReceiptStore(dir,'fixture',key,20);
  assert.throws(()=>store.putPrepared({...prepared,privateBinding:{...prepared.privateBinding,sourceSha:'c'.repeat(40)}},20));
  assert.throws(()=>store.putPrepared({...prepared,privateBinding:{...prepared.privateBinding,repositoryId:'2'}},20));
  assert.equal(store.readPrepared(prepared.receipt.handle,20),undefined);
}));
test('tampered on-disk binding and wrong key fail closed',()=>fixture((dir,key)=>{
  const store=openReceiptStore(dir,'fixture',key,20);store.putPrepared(prepared,20);
  assert.equal(openReceiptStore(dir,'fixture',Buffer.alloc(32,8),20).readPrepared(prepared.receipt.handle,20),undefined);
  const path=join(dir,prepared.receipt.handle.slice(8)+'.json');const text=readFileSync(path,'utf8');assert.equal(text.includes(evidence.toString()),false);
  writeFileSync(path,text.replace(sourceSha,'c'.repeat(40)));assert.equal(store.readPrepared(prepared.receipt.handle,20),undefined);
}));
test('reopened binding plus current approval and bytes resolves through bound reader',()=>fixture((dir,key)=>{
  openReceiptStore(dir,'fixture',key,20).putPrepared(prepared,20);
  const store=openReceiptStore(dir,'fixture',key,20);
  const reader=boundReceiptReader('fixture',approval.revision,20,h=>{const record=store.readPrepared(h,20);return record?{...record,approval,currentSourceSha:sourceSha,evidence}:undefined;});
  assert.deepEqual(reader(prepared.receipt.handle),prepared.receipt);
  const revoked=boundReceiptReader('fixture',approval.revision,20,h=>{const record=store.readPrepared(h,20);return record?{...record,approval:{...approval,repositoryIds:[]},currentSourceSha:sourceSha,evidence}:undefined;});
  assert.equal(revoked(prepared.receipt.handle),undefined);
}));
