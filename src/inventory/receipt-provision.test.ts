import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prepareReceipt, type RetentionApproval, type AuditObservation } from './receipt-provision.ts';
import { openReceiptStore } from './receipt-store.ts';
const approval: RetentionApproval = {owner:'fixture',revision:'a'.repeat(40),approvalId:'fixture-approval',approvedAt:10,expiresAt:40,maxAgeMs:20,repositoryIds:['1','2']};
const observation: AuditObservation = {owner:'fixture',repositoryId:'1',decision:'adopt',sourceSha:'b'.repeat(40),evidenceSha256:'c'.repeat(64),observedAt:12};
test('deterministic exact evidence binding and expiry',()=>{
  const result=prepareReceipt(approval,observation,20);
  assert.deepEqual(result,prepareReceipt(approval,observation,21));
  assert.equal(result.receipt.expiresAt,32);assert.match(result.receipt.handle,/^receipt:[a-f0-9]{64}$/);
  assert.equal(result.privateBinding.sourceSha,observation.sourceSha);
  assert.equal(JSON.stringify(result.receipt).includes(observation.evidenceSha256),false);
});
test('changes to source, digest, decision, approval or revision produce distinct handles',()=>{
  const base=prepareReceipt(approval,observation,20).receipt.handle;
  for(const other of [prepareReceipt(approval,{...observation,sourceSha:'d'.repeat(40)},20),prepareReceipt(approval,{...observation,evidenceSha256:'d'.repeat(64)},20),prepareReceipt(approval,{...observation,decision:'defer'},20),prepareReceipt({...approval,approvalId:'other'},observation,20),prepareReceipt({...approval,revision:'d'.repeat(40)},observation,20)]) assert.notEqual(other.receipt.handle,base);
});
test('approval expiry caps evidence lifetime',()=>assert.equal(prepareReceipt({...approval,expiresAt:25},observation,20).receipt.expiresAt,25));
for(const [name,change] of Object.entries({expired:{expiresAt:20},future:{approvedAt:21},duplicate:{repositoryIds:['1','1']},invalidID:{repositoryIds:['0']},excessRetention:{maxAgeMs:31*86400000},invalidRevision:{revision:'bad'}})) test('reject approval '+name,()=>assert.throws(()=>prepareReceipt({...approval,...change},observation,20)));
for(const [name,change] of Object.entries({foreignOwner:{owner:'other'},unapprovedRepo:{repositoryId:'3'},future:{observedAt:21},beforeApproval:{observedAt:9},stale:{observedAt:10},badDigest:{evidenceSha256:'bad'},badSource:{sourceSha:'bad'}})) test('reject observation '+name,()=>assert.throws(()=>prepareReceipt(approval,{...observation,...change},name==='stale'?30:20)));
test('prepared receipt works with existing authenticated file store',()=>{
  const dir=mkdtempSync(join(tmpdir(),'core-provision-fixture-'));
  try {const result=prepareReceipt(approval,observation,20);const store=openReceiptStore(dir,'fixture',Buffer.alloc(32,7),20);store.put(result.receipt,20);assert.deepEqual(store.read(result.receipt.handle,20),result.receipt);assert.equal(store.read(result.receipt.handle,32),undefined);}
  finally {rmSync(dir,{recursive:true,force:true});}
});
