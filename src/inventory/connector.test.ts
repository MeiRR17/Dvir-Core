import assert from 'node:assert/strict';
import { test } from 'node:test';
import { connectorReader } from './connector.ts';
import { collectAndReview, type ReviewOptions } from './collected-review.ts';
import { PageReadError } from './deadline.ts';
const options: ReviewOptions={owner:'fixture',pageSize:1,maxPages:4,deadlineMs:1000,now:20,revision:'a'.repeat(40)};
const row={id:'123',owner:{login:'fixture',type:'User',url:'private'},visibility:'private',archived:false,repository_full_name:'fixture/private',permissions:{admin:true}};
const envelope=(...repositories:unknown[])=>({result:{repositories}});
const req={owner:'fixture',offset:0,limit:1};
const signal=new AbortController().signal;
test('actual envelope shape and parameter mapping; projection strips metadata',async()=>{
  const reader=connectorReader('fixture',async(args,s)=>{assert.deepEqual(args,{owner:'fixture',page_size:1,page_offset:0});assert.equal(s,signal);return envelope(row);});
  assert.deepEqual(await reader(req,signal),{repositories:[{id:'123',owner:{login:'fixture'},visibility:'private',archived:false}]});
});
test('complete empty sentinel and archive observation',async()=>{
  const reader=connectorReader('fixture',async({page_offset})=>page_offset?envelope():envelope({...row,archived:true}));
  const result=await collectAndReview(reader,[],()=>undefined,options);
  assert.equal(result.collection.stop,'complete');assert.equal(result.review.summary.archived,1);assert.equal(result.review.summary.unknown,1);assert.equal(result.review.summary.complete,false);
});
for(const [label,bad] of [['wrong envelope',{repositories:[row]}],['foreign owner',envelope({...row,owner:{login:'other',type:'User'}})],['organization',envelope({...row,owner:{login:'fixture',type:'Organization'}})],['missing archive',envelope({...row,archived:undefined})],['invalid ID',envelope({...row,id:'abc'})],['missing rows',{result:{}}]] as const){
  test(label+' fails closed',async()=>{
    const result=await collectAndReview(connectorReader('fixture',async()=>bad),[],()=>undefined,options);
    assert.equal(result.collection.stop,'invalid_page');assert.equal(result.collection.coverage.complete,false);
  });
}
test('transport rate-limit retains classification',async()=>{
  const result=await collectAndReview(connectorReader('fixture',async()=>{throw new PageReadError('rate_limited');}),[],()=>undefined,options);
  assert.equal(result.collection.stop,'rate_limited');
});
test('wrong owner request or aborted signal never invokes connector',async()=>{
  let calls=0;const reader=connectorReader('fixture',async()=>{calls++;return envelope();});const c=new AbortController();c.abort();
  await assert.rejects(reader({...req,owner:'other'},signal));await assert.rejects(reader(req,c.signal));assert.equal(calls,0);
});
test('late connector response after cancellation is discarded',async()=>{
  let resolve!: (value: unknown) => void;
  const c=new AbortController();
  const reader=connectorReader('fixture',async()=>new Promise<unknown>(r=>{resolve=r;}));
  const pending=reader(req,c.signal);
  c.abort();
  resolve(envelope(row));
  await assert.rejects(pending,/cancelled/);
});
