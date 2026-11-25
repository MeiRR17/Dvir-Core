import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { runInventoryReview } from './pipeline.ts';
import type { Review } from './decisions.ts';
const revision = 'a'.repeat(40);
const options = { owner:'fixture', pageSize:2, maxPages:4, deadlineMs:1000, now:20, revision };
const row = (id:number, owner='FIXTURE') => ({ id, owner:{login:owner}, visibility:'private', archived:false, name:'private-name' });
const response = (...repositories:unknown[]) => ({result:{repositories}});
const review: Review = {id:'1',decision:'adopt',evidence:'receipt:private'};
const resolve = (handle:string) => ({handle,owner:'fixture',repositoryId:'1',decision:'adopt',revision,observedAt:10,expiresAt:30});
test('complete pagination and verified review; no private IDs or handles in result', async () => {
  const offsets:number[]=[];
  const result=await runInventoryReview(options,async args=>{offsets.push(args.page_offset);return args.page_offset?response():response(row(1));},[review],resolve);
  assert.deepEqual(offsets,[0,2]);
  assert.equal(result.status,'complete');assert.equal(result.review?.summary.adopt,1);
  assert.equal(JSON.stringify(result).includes('receipt:'),false);assert.equal(JSON.stringify(result).includes('private-name'),false);
});
test('missing receipt cannot complete review',async()=>{
  const r=await runInventoryReview(options,async a=>a.page_offset?response():response(row(1)),[review],()=>undefined);
  assert.equal(r.status,'incomplete_review');assert.equal(r.review?.unresolved,1);
});
test('page budget and provider failure never resolve receipts',async()=>{
  let lookups=0;const lookup=()=>{lookups++;return resolve('receipt:private');};
  const capped=await runInventoryReview({...options,maxPages:1},async()=>response(row(1)),[review],lookup);
  assert.equal(capped.status,'incomplete_inventory');assert.equal(capped.collection.stop,'page_limit');
  const failed=await runInventoryReview(options,async a=>{if(a.page_offset)throw new Error('secret');return response(row(1));},[review],lookup);
  assert.equal(failed.status,'incomplete_inventory');assert.equal(failed.collection.coverage.count,1);assert.equal(lookups,0);
});
test('duplicate and foreign owner fail closed',async()=>{
  for(const rows of [[row(1),row(1)],[row(1,'other')]]){const r=await runInventoryReview(options,async()=>response(...rows),[review],()=>{throw new Error('unexpected lookup');});assert.equal(r.status,'incomplete_inventory');assert.equal(r.review,null);}
});
test('deadline stops pipeline and discards late reply',async()=>{
  const r=await runInventoryReview({...options,deadlineMs:10},async()=>new Promise(resolve=>setTimeout(()=>resolve(response(row(1))),30)),[review],()=>{throw new Error('unexpected lookup');});
  assert.equal(r.collection.stop,'deadline');assert.equal(r.review,null);
});
test('invalid review is sanitized',async()=>{
  const r=await runInventoryReview(options,async a=>a.page_offset?response():response(row(1)),[review,review],resolve);
  assert.equal(r.status,'review_error');assert.equal(r.review,null);
});
test('invalid configuration does not contact provider',async()=>{
  let calls=0;await assert.rejects(runInventoryReview({...options,revision:'bad'},async()=>{calls++;return response();},[],resolve));assert.equal(calls,0);
});
