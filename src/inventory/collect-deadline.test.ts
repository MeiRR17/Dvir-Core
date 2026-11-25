import { collectInventory } from './collect.ts';
import { PageReadError } from './deadline.ts';
function equal(a: unknown, b: unknown): void { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error('unexpected result'); }
const page = { repositories: [{ id: 1, owner: { login: 'fixture' }, visibility: 'public' }] };
async function run(): Promise<void> {
  let calls = 0;
  let observed: AbortSignal | undefined;
  const partial = await collectInventory(async (_, signal) => { calls++; if (calls === 1) return page; observed = signal; return new Promise(() => {}); }, 'fixture', 1, 5, 20);
  equal(partial, { coverage: { complete: false, count: 1, publicCount: 1, pageCount: 1 }, stop: 'deadline' });
  equal(calls, 2);
  equal(observed?.aborted, true);
  equal((await collectInventory(async () => { throw new PageReadError('rate_limited'); }, 'fixture')).stop, 'rate_limited');
  equal((await collectInventory(async () => { throw new Error('secret'); }, 'fixture')).stop, 'transport_error');
  equal((await collectInventory(async () => ({ repositories: [] }), 'fixture')).stop, 'complete');
  let rejected = false;
  try { await collectInventory(async () => page, 'fixture', 1, 1, 0); } catch { rejected = true; }
  equal(rejected, true);
  console.log('collector deadline fixture: 7 checks passed');
}
void run();
