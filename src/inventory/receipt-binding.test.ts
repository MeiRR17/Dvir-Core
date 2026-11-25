import assert from 'node:assert/strict';
import { test } from 'node:test';
import { prepareAuditBatch, verifyBoundReceipt, boundReceiptReader, type EvidenceInput, type BoundEvidence } from './receipt-binding.ts';
import type { RetentionApproval } from './receipt-provision.ts';
import { reviewInventory } from './review.ts';
const approval: RetentionApproval = {owner:'fixture',revision:'a'.repeat(40),approvalId:'fixture-approval',approvedAt:10,expiresAt:40,maxAgeMs:20,repositoryIds:['1','2']};
const input: EvidenceInput = {owner:'fixture',repositoryId:'1',decision:'adopt',sourceSha:'b'.repeat(40),observedAt:12,evidence:Buffer.from('synthetic evidence')};
const prepared=prepareAuditBatch(approval,[input],20)[0];
const context: BoundEvidence={...prepared,approval,currentSourceSha:input.sourceSha,evidence:input.evidence};
test('batch preparation computes evidence hash and omits raw bytes',()=>{
  assert.deepEqual(prepareAuditBatch(approval,[input],20),[prepared]);
  assert.equal(JSON.stringify(prepared).includes('synthetic evidence'),false);
  assert.deepEqual(verifyBoundReceipt(context,20),prepared.receipt);
});
test('multi-repository batch and duplicate rejection',()=>{
  assert.equal(prepareAuditBatch(approval,[input,{...input,repositoryId:'2'}],20).length,2);
  assert.throws(()=>prepareAuditBatch(approval,[input,input],20));
});
test('invalid batch counts, bytes and cumulative budget reject',()=>{
  assert.throws(()=>prepareAuditBatch(approval,[],20));
  assert.throws(()=>prepareAuditBatch(approval,Array(101).fill(input),20));
  for(const evidence of [Buffer.alloc(0),Buffer.alloc(65537),'bad' as unknown as Uint8Array]) assert.throws(()=>prepareAuditBatch(approval,[{...input,evidence}],20));
  const ids=Array.from({length:17},(_,i)=>String(i+1));
  assert.throws(()=>prepareAuditBatch({...approval,repositoryIds:ids},ids.map(repositoryId=>({...input,repositoryId,evidence:Buffer.alloc(65536)})),20),/budget/);
});
test('unapproved repository rejects entire preparation',()=>assert.throws(()=>prepareAuditBatch(approval,[input,{...input,repositoryId:'3'}],20)));
for(const [name,change] of Object.entries({modifiedEvidence:{evidence:Buffer.from('changed')},changedSource:{currentSourceSha:'c'.repeat(40)},changedReceipt:{receipt:{...prepared.receipt,decision:'defer'}},changedBinding:{privateBinding:{...prepared.privateBinding,evidenceSha256:'c'.repeat(64)}},changedApproval:{approval:{...approval,approvalId:'other'}},revokedScope:{approval:{...approval,repositoryIds:['2']}},shorterApproval:{approval:{...approval,expiresAt:25}},badVersion:{privateBinding:{...prepared.privateBinding,version:2}}})) test(name+' fails closed',()=>assert.equal(verifyBoundReceipt({...context,...change} as BoundEvidence,20),undefined));
test('expired evidence fails closed',()=>assert.equal(verifyBoundReceipt(context,32),undefined));
test('reader rejects invalid handle before lookup and sanitizes lookup errors',()=>{
  let calls=0;const reader=boundReceiptReader('fixture',approval.revision,20,()=>{calls++;throw new Error('private fixture');});
  assert.equal(reader('receipt:legacy'),undefined);assert.equal(calls,0);
  assert.equal(reader(prepared.receipt.handle),undefined);assert.equal(calls,1);
});
test('reader binds owner, audit revision and requested handle',()=>{
  assert.equal(boundReceiptReader('other',approval.revision,20,()=>context)(prepared.receipt.handle),undefined);
  assert.equal(boundReceiptReader('fixture','c'.repeat(40),20,()=>context)(prepared.receipt.handle),undefined);
  assert.equal(boundReceiptReader('fixture',approval.revision,20,()=>context)('receipt:'+'d'.repeat(64)),undefined);
});
test('review resolves bound evidence and denies changed bytes',()=>{
  const pages=[{offset:0,repositories:[{id:'1',owner:{login:'fixture'},visibility:'private',archived:false}]},{offset:1,repositories:[]}];
  const reviews=[{id:'1',decision:'adopt' as const,evidence:prepared.receipt.handle}];
  const run=(data:BoundEvidence)=>reviewInventory('fixture',pages,1,reviews,boundReceiptReader('fixture',approval.revision,20,()=>data),20,approval.revision);
  assert.equal(run(context).summary.complete,true);
  assert.equal(run({...context,evidence:Buffer.from('changed')}).summary.unknown,1);
  assert.equal(JSON.stringify(run(context)).includes('receipt:'),false);
});

test('authenticated file receipt still requires matching private binding',async()=>{
  const {mkdtempSync,rmSync}=await import('node:fs');
  const {tmpdir}=await import('node:os');
  const {join}=await import('node:path');
  const {openReceiptStore}=await import('./receipt-store.ts');
  const dir=mkdtempSync(join(tmpdir(),'core-bound-fixture-'));
  try {
    const key=Buffer.alloc(32,7);
    openReceiptStore(dir,'fixture',key,20).put(prepared.receipt,20);
    const store=openReceiptStore(dir,'fixture',key,20);
    const lookup=(handle:string)=>{const receipt=store.read(handle,20);return receipt?{...context,receipt}:undefined;};
    assert.deepEqual(boundReceiptReader('fixture',approval.revision,20,lookup)(prepared.receipt.handle),prepared.receipt);
    assert.equal(boundReceiptReader('fixture',approval.revision,20,h=>{const found=lookup(h);return found?{...found,currentSourceSha:'d'.repeat(40)}:undefined;})(prepared.receipt.handle),undefined);
  } finally {rmSync(dir,{recursive:true,force:true});}
});
