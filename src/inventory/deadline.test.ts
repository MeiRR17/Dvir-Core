import { classifyReadError, PageReadError, readWithDeadline } from './deadline.ts';
function equal(a: unknown, b: unknown): void { if (a !== b) throw new Error('unexpected result'); }
async function failure(run: () => Promise<unknown>): Promise<unknown> {
  try { await run(); } catch (error) { return error; }
  throw new Error('expected rejection');
}
async function run(): Promise<void> {
  equal(await readWithDeadline(async signal => { equal(signal.aborted, false); return 7; }, 1000), 7);
  let observed: AbortSignal | undefined;
  const timeout = await failure(() => readWithDeadline(signal => { observed = signal; return new Promise(() => {}); }, 5));
  equal(classifyReadError(timeout), 'deadline');
  equal(observed?.aborted, true);
  equal(classifyReadError(await failure(() => readWithDeadline(async () => { throw new PageReadError('rate_limited'); }, 1000))), 'rate_limited');
  equal(classifyReadError(await failure(() => readWithDeadline(async () => { throw new Error('private fixture'); }, 1000))), 'transport_error');
  equal(classifyReadError({ code: 'rate_limited' }), 'transport_error');
  let calls = 0;
  await failure(() => readWithDeadline(async () => { calls++; }, 0));
  equal(calls, 0);
  console.log('deadline fixture: 7 checks passed');
}
void run();
