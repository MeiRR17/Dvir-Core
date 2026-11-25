import { collectInventory, normalizePage, type PageReader } from './collect.ts';
const row = (id: string | number, login = 'fixture', visibility = 'public') => ({ id, owner: { login }, visibility, secret: 'fixture-secret' });
const page = (...repositories: unknown[]) => ({ repositories });
function equal(actual: unknown, expected: unknown): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error('unexpected result');
}
async function run(): Promise<void> {
  let calls = 0;
  const reader: PageReader = async request => { equal(request, { owner: 'fixture', offset: calls * 2, limit: 2 }); return [page(row(1), row('2', 'fixture', 'private')), page(row(3)), page()][calls++]; };
  equal(await collectInventory(reader, 'fixture', 2), { coverage: { complete: true, count: 3, publicCount: 2, pageCount: 3 }, stop: 'complete' });
  equal(normalizePage(page(row(1)), 0, 2), { offset: 0, repos: [{ id: '1', owner: 'fixture', visibility: 'public' }] });
  equal((await collectInventory(async () => page(row(1)), 'fixture', 2, 1)).stop, 'page_limit');
  equal((await collectInventory(async () => page(row(1)), 'fixture', 2)).stop, 'invalid_page');
  equal((await collectInventory(async () => page(row(1, 'other')), 'fixture', 2)).coverage.count, 0);
  equal((await collectInventory(async () => page(row(1, 'fixture', 'unknown')), 'fixture')).stop, 'invalid_page');
  equal((await collectInventory(async () => page(row(1.5)), 'fixture')).stop, 'invalid_page');
  equal((await collectInventory(async () => ({ repositories: 'not an array' }), 'fixture')).stop, 'invalid_page');
  equal((await collectInventory(async () => page(row(1), row(2), row(3)), 'fixture', 2)).stop, 'invalid_page');
  equal((await collectInventory(async () => page(row(1), row('1')), 'fixture', 2)).stop, 'invalid_page');
  const partial = await collectInventory(async ({ offset }) => { if (offset) throw new Error('fixture-secret'); return page(row(1), row(2)); }, 'fixture', 2);
  equal(partial, { coverage: { complete: false, count: 2, publicCount: 2, pageCount: 1 }, stop: 'transport_error' });
  equal((await collectInventory(async () => page(), 'fixture')).coverage.complete, true);
  let rejected = false;
  try { await collectInventory(async () => page(), 'fixture', 2, 0); } catch { rejected = true; }
  equal(rejected, true);
  console.log('13 fixture cases passed');
}
void run();
