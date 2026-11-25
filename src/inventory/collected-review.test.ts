import assert from 'node:assert/strict';
import { test } from 'node:test';
import { collectAndReview, type ReviewOptions } from './collected-review.ts';
import { PageReadError } from './deadline.ts';
import { openReceiptStore } from './receipt-store.ts';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Review } from './decisions.ts';
const options: ReviewOptions = {owner:'fixture',pageSize:1,maxPages:4,deadlineMs:1000,now:20,revision:'a'.repeat(40)};
const rows = (id:number, archived:unknown=false, owner='fixture') => ({repositories:[{id,owner:{login:owner},visibility:'private',archived,secret:'fixture-secret'}]});
const empty = {repositories:[]};
const reviews: Review[] = [{id:'1',decision:'adopt',evidence:'receipt:one'},{id:'2',decision:'defer',evidence:'receipt:two'}];
const receipt = (handle:string) => ({handle,owner:'fixture',repositoryId:handle.endsWith('one')?'1':'2',decision:handle.endsWith('one')?'adopt':'defer',revision:options.revision,observedAt:10,expiresAt:30});
test('full transport-to-filesystem review, aggregate output',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'core-collected-'));
  try {
    const store=openReceiptStore(dir,'fixture',Buffer.alloc(32,7),20);
    store.put({...receipt('receipt:one'),decision:'adopt'},20);
    store.put({...receipt('receipt:two'),decision:'defer'},20);
    const result=await collectAndReview(async ({offset})=>[rows(1),rows(2,true),empty][offset],reviews,h=>store.read(h,20),options);
    assert.equal(result.collection.stop,'complete'); assert.equal(result.review.summary.complete,true); assert.equal(result.review.summary.archived,1); assert.equal(result.unobservedReviews,0);
    assert.equal(JSON.stringify(result).includes('receipt:'),false); assert.equal(JSON.stringify(result).includes('fixture-secret'),false);
  } finally {rmSync(dir,{recursive:true,force:true});}
});
test('partial transport error retains only accepted decisions',async()=>{
  const seen:string[]=[];
  const result=await collectAndReview(async ({offset})=>{if(offset)throw new PageReadError('rate_limited');return rows(1);},reviews,h=>{seen.push(h);return receipt(h);},options);
  assert.equal(result.collection.stop,'rate_limited'); assert.equal(result.review.summary.adopt,1); assert.equal(result.review.summary.complete,false); assert.equal(result.unobservedReviews,1); assert.deepEqual(seen,['receipt:one']);
});
for(const [name,bad] of [['duplicate',rows(1)],['foreign owner',rows(2,false,'other')],['archive missing',rows(2,null)],['malformed',null]] as const){
  test(name+' discards rejected page',async()=>{
    const result=await collectAndReview(async ({offset})=>offset?bad:rows(1),reviews,receipt,options);
    assert.equal(result.collection.stop,'invalid_page'); assert.equal(result.review.summary.repositories,1); assert.equal(result.unobservedReviews,1); assert.equal(result.review.summary.complete,false);
  });
}
test('deadline ignores late transport result',async()=>{
  let release: (value:unknown)=>void=()=>{};
  const result=await collectAndReview(async ({offset})=>offset?new Promise(r=>{release=r;}):rows(1),reviews,receipt,{...options,deadlineMs:10});
  release(rows(2)); await Promise.resolve();
  assert.equal(result.collection.stop,'deadline'); assert.equal(result.review.summary.repositories,1); assert.equal(result.unobservedReviews,1);
});
test('complete inventory rejects out-of-scope review IDs',async()=>{
  await assert.rejects(collectAndReview(async ({offset})=>offset?empty:rows(1),reviews,receipt,options),/outside complete/);
});
test('invalid reviews reject before transport',async()=>{
  let calls=0; await assert.rejects(collectAndReview(async ()=>{calls++;return empty;},[reviews[0],reviews[0]],receipt,options)); assert.equal(calls,0);
});
test('page budget preserves partial state',async()=>{
  const result=await collectAndReview(async ()=>rows(1),reviews,receipt,{...options,maxPages:1}); assert.equal(result.collection.stop,'page_limit'); assert.equal(result.review.summary.complete,false);
});
