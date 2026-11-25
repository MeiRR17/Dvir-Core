import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runPreparedAudit, type AuditAuthority, type AuditConfig, type SourceEvidence } from './audit.ts';
import { prepareAuditBatch } from './receipt-binding.ts';
import { openReceiptStore } from './receipt-store.ts';
import type { RetentionApproval } from './receipt-provision.ts';
const owner='fixture', revision='a'.repeat(40), sourceSha='b'.repeat(40), evidence=Buffer.from('synthetic');
const approval: RetentionApproval={owner,revision,approvalId:'fixture',approvedAt:10,expiresAt:50,maxAgeMs:30,repositoryIds:['1']};
const prepared=prepareAuditBatch(approval,[{owner,repositoryId:'1',decision:'adopt',sourceSha,observedAt:12,evidence}],20)[0];
const reviews=[{id:'1',decision:'adopt' as const,evidence:prepared.receipt.handle}];
const row={id:'1',owner:{login:owner,type:'User'},archived:false,visibility:'private',secret:'fixture-secret'};
const list=async ({page_offset}:{page_offset:number})=>({result:{repositories:page_offset?[]:[row]}});
const source: SourceEvidence={owner,repositoryId:'1',sourceSha,evidence};
const authority: AuditAuthority={approval:()=>({status:'verified',checkedAt:19,value:approval}),source:()=>({status:'verified',checkedAt:19,value:source})};
async function fixture(run:(cfg:AuditConfig)=>Promise<void>,legacy=false) {
  const directory=mkdtempSync(join(tmpdir(),'core-audit-'));
  const cfg:AuditConfig={directory,owner,revision,secret:Buffer.alloc(32,7),maxAgeMs:30,maxContextAgeMs:5,now:20,pageSize:1,maxPages:3,deadlineMs:1000};
  try {const store=openReceiptStore(directory,owner,cfg.secret,30);if(legacy)store.put(prepared.receipt,20);else store.putPrepared(prepared,20);await run(cfg);}finally{rmSync(directory,{recursive:true,force:true});}
}
test('connector through authenticated prepared store and trusted current context',()=>fixture(async cfg=>{
  const r=await runPreparedAudit(cfg,list,reviews,authority);assert.equal(r.collection.stop,'complete');assert.equal(r.review.summary.complete,true);assert.equal(r.review.summary.adopt,1);assert.equal(JSON.stringify(r).includes('fixture-secret'),false);assert.equal(JSON.stringify(r).includes('receipt:'),false);
}));
test('legacy record cannot call authority',()=>fixture(async cfg=>{
  let calls=0;const r=await runPreparedAudit(cfg,list,reviews,{approval:()=>{calls++;return {status:'denied'};},source:()=>{calls++;return {status:'denied'};}});assert.equal(calls,0);assert.equal(r.review.summary.unknown,1);
},true));
for(const status of ['denied','unknown','error'] as const)test('approval '+status+' prevents source lookup',()=>fixture(async cfg=>{
  let calls=0;const r=await runPreparedAudit(cfg,list,reviews,{approval:()=>({status}),source:()=>{calls++;return {status:'unknown'};}});assert.equal(calls,0);assert.equal(r.review.summary.unknown,1);
}));
test('stale or future approval and revoked scope prevent source lookup',()=>fixture(async cfg=>{
  let calls=0;for(const [checkedAt,value] of [[14,approval],[21,approval],[19,{...approval,repositoryIds:[]}]] as const){const r=await runPreparedAudit(cfg,list,reviews,{approval:()=>({status:'verified',checkedAt,value}),source:()=>{calls++;return {status:'unknown'};}});assert.equal(r.review.summary.complete,false);}assert.equal(calls,0);
}));
test('source mismatch, stale context or changed evidence fail closed',()=>fixture(async cfg=>{
  for(const [checkedAt,value] of [[14,source],[19,{...source,repositoryId:'2'}],[19,{...source,sourceSha:'c'.repeat(40)}],[19,{...source,evidence:Buffer.from('changed')}]] as const){const r=await runPreparedAudit(cfg,list,reviews,{...authority,source:()=>({status:'verified',checkedAt,value})});assert.equal(r.review.summary.unknown,1);}
}));
test('private authority errors become unknown without exposing error text',()=>fixture(async cfg=>{
  const r=await runPreparedAudit(cfg,list,reviews,{...authority,source:()=>{throw new Error('private fixture error');}});assert.equal(r.review.unresolved,1);assert.equal(JSON.stringify(r).includes('private fixture error'),false);
}));
test('invalid audit budget rejects before connector',()=>fixture(async cfg=>{
  let calls=0;await assert.rejects(runPreparedAudit({...cfg,maxContextAgeMs:300001},async()=>{calls++;return {};},reviews,authority));assert.equal(calls,0);
}));
