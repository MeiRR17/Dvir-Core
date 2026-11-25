import { gateDecisions, type InventoryPage } from './evidence-gate.ts';
import type { Review } from './decisions.ts';
let checks = 0;
function equal(a: unknown, b: unknown): void { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error('unexpected result'); checks++; }
function rejects(fn: () => unknown): void { try { fn(); } catch { checks++; return; } throw new Error('expected rejection'); }
const pages: InventoryPage[] = [{ offset: 0, repositories: [{ id: '1', owner: 'fixture', archived: false }] }, { offset: 2, repositories: [] }];
const review: Review = { id: '1', decision: 'adopt', evidence: 'receipt:private_fixture' };
const receipt = { handle: review.evidence, owner: 'fixture', repositoryId: '1', decision: 'adopt', state: 'verified' };
const run = (value: unknown) => gateDecisions('fixture', pages, 2, [review], () => value);
equal(run(receipt), { repositories: 1, archived: 0, active: 1, adopt: 1, defer: 0, not_applicable: 0, unknown: 0, complete: true, enumerationComplete: true, unresolved: 0 });
equal(gateDecisions('fixture', pages.slice(0, 1), 2, [review], () => receipt).complete, false);
for (const value of [null, { ...receipt, owner: 'other' }, { ...receipt, repositoryId: '2' }, { ...receipt, decision: 'defer' }, { ...receipt, state: 'pending' }, { ...receipt, handle: 'receipt:wrong' }]) equal([run(value).complete, run(value).unresolved], [false, 1]);
equal(gateDecisions('fixture', pages, 2, [review], () => { throw new Error('private_fixture'); }).unresolved, 1);
equal(JSON.stringify(run(receipt)).includes('private_fixture'), false);
rejects(() => gateDecisions('fixture', [pages[0], { offset: 2, repositories: [{ id: '2', owner: 'fixture', archived: false }] }], 2, [], () => null));
rejects(() => gateDecisions('fixture', [...pages, { offset: 4, repositories: [] }], 2, [], () => null));
let calls = 0;
rejects(() => gateDecisions('fixture', pages, 2, [review, review], () => { calls++; return receipt; }));
equal(calls, 0);
equal(gateDecisions('fixture', pages, 2, [], () => receipt).complete, false);
console.log(`${checks} evidence gate checks passed`);
