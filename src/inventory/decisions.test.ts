import { summarizeDecisions } from './decisions.ts';
function equal(a: unknown, b: unknown): void { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error('unexpected result'); }
function rejects(fn: () => unknown): void { try { fn(); } catch { return; } throw new Error('expected rejection'); }
const repo = (id: string, archived: boolean | null = false, owner = 'fixture') => ({ id, owner, archived, name: 'private-fixture' });
const review = (id: string, decision: string, owner = 'fixture') => ({ id, owner, decision, evidence: 'private-evidence' });
const input = [repo('1'), repo('2', true), repo('3', null), repo('4')];
const result = summarizeDecisions('FIXTURE', input, [review('1', 'adopt'), review('2', 'defer'), review('3', 'not_applicable')]);
equal(result, { total: 4, adopt: 1, defer: 1, not_applicable: 1, unknown: 1, archived: 1, archiveUnknown: 1, reviewComplete: false });
equal(summarizeDecisions('fixture', input, [...['1','2','3','4'].map(id => review(id, 'defer'))]).reviewComplete, true);
equal(summarizeDecisions('fixture', [repo('1')], [review('1', 'unknown')]).unknown, 1);
equal(JSON.stringify(result).includes('private-'), false);
rejects(() => summarizeDecisions('fixture', [repo('1', false, 'other')], []));
rejects(() => summarizeDecisions('fixture', [repo('1'), repo('1')], []));
rejects(() => summarizeDecisions('fixture', input, [review('5', 'adopt')]));
rejects(() => summarizeDecisions('fixture', input, [review('1', 'adopt'), review('1', 'defer')]));
rejects(() => summarizeDecisions('fixture', input, [review('1', 'invalid')]));
rejects(() => summarizeDecisions('fixture', input, [{ ...review('1', 'adopt'), evidence: '' }]));
rejects(() => summarizeDecisions('fixture', [{ ...repo('1'), archived: undefined }], []));
rejects(() => summarizeDecisions('fixture', input, [review('1', 'adopt', 'other')]));
console.log('12 decision inventory assertions passed');
