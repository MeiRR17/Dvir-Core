import { collectInventory } from './collect.ts';
import { PageReadError, withPageDeadline } from './deadline.ts';
function equal(actual: unknown, expected: unknown) { if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error('unexpected result'); }
const page = (...ids: number[]) => ({ repositories: ids.map(id => ({ id, owner: { login: 'FIXTURE' }, visibility: 'private', secret: 'not-for-receipt' })) });
async function run() {
  equal(await withPageDeadline(async signal => signal.aborted, 1000), false);
  let aborted = false;
  let calls = 0;
  const partial = await collectInventory(async ({ offset }, signal) => {
    calls++;
    if (!offset) return page(1, 2);
    signal.addEventListener('abort', () => { aborted = true; }, { once: true });
    return new Promise(() => {});
  }, 'fixture', 2, 4, 20);
  equal(partial, { coverage: { complete: false, count: 2, publicCount: 0, pageCount: 1 }, stop: 'timeout' });
  equal(aborted, true);
  equal(calls, 2);
  for (const kind of ['rate_limit', 'denied', 'transport_error'] as const) {
    equal((await collectInventory(async () => { throw new PageReadError(kind); }, 'fixture')).stop, kind);
  }
  equal((await collectInventory(async () => { throw new Error('not-for-receipt'); }, 'fixture')).stop, 'transport_error');
  equal((await collectInventory(async () => page(), 'fixture')).stop, 'complete');
  let invalid = false;
  try { await collectInventory(async () => page(), 'fixture', 2, 4, 0); } catch { invalid = true; }
  equal(invalid, true);
  console.log('10 deadline and classification assertions passed');
}
void run().catch(error => { throw error; });
