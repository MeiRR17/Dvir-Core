import { summarizeInventory, type Page, type Repo } from './coverage.ts';
const repo = (id: string, owner = 'fixture', visibility: Repo['visibility'] = 'public'): Repo => ({ id, owner, visibility });
const page = (offset: number, ...repos: Repo[]): Page => ({ offset, repos });
function equal(actual: unknown, expected: unknown): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error('unexpected result');
}
function rejects(run: () => unknown): void {
  try { run(); } catch { return; }
  throw new Error('expected rejection');
}
equal(summarizeInventory([page(0, repo('1'), repo('2', 'fixture', 'private')), page(2)], 'fixture', 2), { complete: true, count: 2, publicCount: 1, pageCount: 2 });
equal(summarizeInventory([page(0, repo('1'))], 'fixture', 2).complete, false);
equal(summarizeInventory([page(0)], 'fixture', 2).complete, true);
rejects(() => summarizeInventory([page(0, repo('1', 'other'))], 'fixture', 2));
rejects(() => summarizeInventory([page(0, repo('1')), page(2, repo('1'))], 'fixture', 2));
rejects(() => summarizeInventory([page(0), page(2)], 'fixture', 2));
rejects(() => summarizeInventory([page(1)], 'fixture', 2));
rejects(() => summarizeInventory([page(0, repo('1'), repo('2'), repo('3'))], 'fixture', 2));
rejects(() => summarizeInventory([], 'fixture', 0));
console.log('9 fixture assertions passed');
