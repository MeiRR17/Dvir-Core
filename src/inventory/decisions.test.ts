import { summarizeDecisions, type Repository, type Review } from './decisions.ts';
const repo = (id: string, archived = false, owner = 'fixture'): Repository => ({ id, archived, owner });
const review = (id: string, decision: Review['decision'] = 'adopt', evidence = 'receipt:synthetic'): Review => ({ id, decision, evidence });
let checks = 0;
function equal(a: unknown, b: unknown): void { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error('unexpected result'); checks++; }
function rejects(fn: () => unknown): void { try { fn(); } catch { checks++; return; } throw new Error('expected rejection'); }
const repos = [repo('1'), repo('2', true), repo('3'), repo('4')];
const reviewed = [review('1'), review('2', 'defer'), review('3', 'not_applicable')];
equal(summarizeDecisions('fixture', repos, reviewed, true), { repositories: 4, archived: 1, active: 3, adopt: 1, defer: 1, not_applicable: 1, unknown: 1, complete: false });
equal(summarizeDecisions('fixture', repos, [...reviewed, review('4')], true).complete, true);
equal(summarizeDecisions('fixture', repos, [...reviewed, review('4')], false).complete, false);
equal(summarizeDecisions('fixture', repos, [review('1', 'unknown', '')], true).unknown, 4);
equal(summarizeDecisions('fixture', [], [], true).complete, true);
rejects(() => summarizeDecisions('fixture', [repo('1', false, 'other')], [], true));
rejects(() => summarizeDecisions('fixture', [repo('1'), repo('1', true)], [], true));
rejects(() => summarizeDecisions('fixture', [repo('0')], [], true));
rejects(() => summarizeDecisions('fixture', repos, [review('9')], true));
rejects(() => summarizeDecisions('fixture', repos, [review('1'), review('1', 'defer')], true));
rejects(() => summarizeDecisions('fixture', repos, [review('1', 'adopt', '')], true));
rejects(() => summarizeDecisions('fixture', repos, [review('1', 'adopt', 'https://private.example')], true));
rejects(() => summarizeDecisions('fixture', repos, [review('1', 'bad' as Review['decision'])], true));
rejects(() => summarizeDecisions('bad/owner', repos, [], true));
equal(JSON.stringify(summarizeDecisions('fixture', repos, reviewed, true)).includes('receipt:'), false);
console.log(`decision fixture: ${checks} checks passed`);
