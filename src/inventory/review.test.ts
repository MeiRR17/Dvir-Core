import { reviewInventory } from './review.ts';
import type { Review } from './decisions.ts';
const revision = 'a'.repeat(40);
const row = (id: number, archived = false, login = 'fixture') => ({ id, archived, owner: { login }, visibility: 'private' });
const pages = [{ offset: 0, repositories: [row(1), row(2, true)] }, { offset: 2, repositories: [] }];
const reviews: Review[] = [{ id: '1', decision: 'adopt', evidence: 'receipt:one' }, { id: '2', decision: 'defer', evidence: 'receipt:two' }];
const receipt = (handle: string) => ({ handle, owner: 'fixture', repositoryId: handle.endsWith('one') ? '1' : '2', decision: handle.endsWith('one') ? 'adopt' : 'defer', revision, observedAt: 10, expiresAt: 30 });
let checks = 0;
function eq(a: unknown, b: unknown) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error('unexpected result'); checks++; }
function rejects(fn: () => unknown) { try { fn(); } catch { checks++; return; } throw new Error('expected rejection'); }
const run = (resolve: (handle: string) => unknown = receipt) => reviewInventory('fixture', pages, 2, reviews, resolve, 20, revision);
eq(run(), { summary: { repositories: 2, archived: 1, active: 1, adopt: 1, defer: 1, not_applicable: 0, unknown: 0, complete: true }, unresolved: 0 });
for (const mismatch of [{owner:'other'}, {repositoryId:'9'}, {decision:'not_applicable'}, {revision:'b'.repeat(40)}, {handle:'receipt:wrong'}, {expiresAt:20}, {observedAt:21}, {observedAt:-1}, {expiresAt:Infinity}]) {
  eq(run(h => ({...receipt(h), ...mismatch})).unresolved, 2);
}
eq(run(() => undefined).summary.unknown, 2);
eq(run(() => { throw new Error('private details'); }).summary.complete, false);
eq(JSON.stringify(run()).includes('receipt:'), false);
eq(reviewInventory('fixture', pages.slice(0,1), 2, reviews, receipt, 20, revision).summary.complete, false);
let calls = 0;
rejects(() => reviewInventory('fixture', [{offset:0,repositories:[row(1,false,'other')]}], 2, [], () => { calls++; }, 20, revision));
rejects(() => reviewInventory('fixture', pages, 2, [...reviews,reviews[0]], () => { calls++; }, 20, revision));
eq(calls, 0);
rejects(() => reviewInventory('fixture', [{offset:0,repositories:[{...row(1),archived:null}]}], 2, [], receipt, 20, revision));
rejects(() => reviewInventory('fixture', pages, 2, reviews, receipt, 20, 'bad'));
console.log(`verified review fixture: ${checks} checks passed`);
