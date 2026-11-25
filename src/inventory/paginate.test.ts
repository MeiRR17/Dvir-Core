import { collectInventory, type PageResponse, type PageRequest } from './paginate.ts';
const repo = (id: string, owner = 'Fixture') => ({ id, owner, visibility: 'private', name: 'must-not-leak' });
const ok = (...repos: unknown[]): PageResponse => ({ kind: 'ok', repos });
function equal(actual: unknown, expected: unknown) { if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error('unexpected result'); }
async function run() {
  const calls: number[] = [];
  const responses = [ok(repo('1')), ok(repo('2')), ok()];
  const result = await collectInventory('fixture', async (r: PageRequest) => { calls.push(r.offset); return responses.shift()!; }, 2, 4);
  equal(calls, [0, 2, 4]);
  equal(result, { complete: true, count: 2, publicCount: 0, pageCount: 3, stop: 'complete' });
  equal((await collectInventory('fixture', async () => ok(), 2, 1)).stop, 'complete');
  equal((await collectInventory('fixture', async () => ok(repo('1')), 2, 1)).stop, 'budget');
  for (const kind of ['rate_limit', 'denied', 'unavailable'] as const) {
    let n = 0;
    equal(await collectInventory('fixture', async () => n++ === 0 ? ok(repo('1')) : { kind }, 2), { complete: false, count: 1, publicCount: 0, pageCount: 1, stop: kind });
  }
  equal((await collectInventory('fixture', async () => { throw new Error('secret'); })).stop, 'unavailable');
  for (const bad of [ok(repo('1', 'other')), ok(null), ok({ id: 1, owner: 'fixture', visibility: 'public' }), ok(repo('1'), repo('2'), repo('3'))]) equal((await collectInventory('fixture', async () => bad, 2)).stop, 'invalid_page');
  equal(await collectInventory('fixture', async () => ok(repo('1')), 2), { complete: false, count: 1, publicCount: 0, pageCount: 1, stop: 'invalid_page' });
  let rejected = false;
  try { await collectInventory('fixture', async () => ok(), 2, 101); } catch { rejected = true; }
  equal(rejected, true);
  console.log('14 fixture assertions passed');
}
void run().catch(error => { throw error; });
