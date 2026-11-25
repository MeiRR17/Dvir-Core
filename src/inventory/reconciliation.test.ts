import { collectInventory } from './collect.ts';
import { PageReadError, classifyReadError } from './deadline.ts';
function equal(actual: unknown, expected: unknown): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error('unexpected result');
}
const row = (id: number | string, login = 'FIXTURE') => ({ id, owner: { login }, visibility: 'private', secret: 'fixture-secret' });
const page = (...repositories: unknown[]) => ({ repositories });
async function run(): Promise<void> {
  const pages = [page(row(1), row('2')), page()];
  equal(await collectInventory(async () => pages.shift(), 'fixture', 2), { coverage: { complete: true, count: 2, publicCount: 0, pageCount: 2 }, stop: 'complete' });
  equal((await collectInventory(async () => page(row(1, 'other')), 'fixture')).stop, 'invalid_page');
  equal((await collectInventory(async () => page(row(1), row('1')), 'fixture')).stop, 'invalid_page');
  const partial = await collectInventory(async ({ offset }) => { if (offset) throw new PageReadError('denied'); return page(row(1)); }, 'fixture', 1);
  equal(partial, { coverage: { complete: false, count: 1, publicCount: 0, pageCount: 1 }, stop: 'denied' });
  equal(classifyReadError({ code: 'denied' }), 'transport_error');
  equal((await collectInventory(async () => { throw new Error('fixture-secret'); }, 'fixture')).stop, 'transport_error');
  equal((await collectInventory(async ({ offset }) => offset ? page(row(2)) : page(row(1)), 'fixture', 2)).stop, 'invalid_page');
  for (const owner of ['', 'wrong/owner', 'a'.repeat(40)]) {
    let calls = 0; let rejected = false;
    try { await collectInventory(async () => { calls++; return page(); }, owner); } catch { rejected = true; }
    equal([rejected, calls], [true, 0]);
  }
  console.log('10 reconciliation cases passed');
}
void run().catch(error => { throw error; });
