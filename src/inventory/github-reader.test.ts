import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { createGitHubReader } from './github-reader.ts';
const row = { id: 1, owner: { login: 'FIXTURE', email: 'private' }, visibility: 'private', archived: false, name: 'private-name' };
const response = (...repositories: unknown[]) => ({ result: { repositories } });
const request = { owner: 'fixture', offset: 0, limit: 2 };
const signal = () => new AbortController().signal;
test('maps connector contract and strips all unnecessary metadata', async () => {
  const s = signal();
  const reader = createGitHubReader('fixture', async (args, received) => {
    assert.deepEqual(args, { owner: 'fixture', page_size: 2, page_offset: 0, include_search_index_status: false });
    assert.equal(received, s);
    return response(row);
  });
  assert.deepEqual(await reader(request, s), { repositories: [{ id: '1', owner: { login: 'fixture' }, visibility: 'private', archived: false }] });
});
test('empty response is preserved', async () => {
  assert.deepEqual(await createGitHubReader('fixture', async () => response())(request, signal()), { repositories: [] });
});
test('rejects unscoped requests before invoking transport', async () => {
  let calls = 0;
  const reader = createGitHubReader('fixture', async () => { calls++; return response(); });
  for (const req of [{ ...request, owner: 'other' }, { ...request, offset: 1 }, { ...request, limit: 101 }, { ...request, offset: 200 }]) await assert.rejects(reader(req, signal()), /invalid scoped request/);
  assert.equal(calls, 0);
});
test('rejects foreign owners, missing archive state, invalid IDs and visibility', async () => {
  for (const bad of [{ ...row, owner: { login: 'other' } }, { ...row, archived: null }, { ...row, id: 1.2 }, { ...row, visibility: 'unknown' }]) await assert.rejects(createGitHubReader('fixture', async () => response(bad))(request, signal()), /invalid scoped repository/);
});
test('rejects malformed or oversized response', async () => {
  for (const raw of [null, { result: {} }, response(row, row, row)]) await assert.rejects(createGitHubReader('fixture', async () => raw)(request, signal()), /invalid connector response/);
});
test('sanitizes provider errors', async () => {
  await assert.rejects(createGitHubReader('fixture', async () => { throw new Error('private secret'); })(request, signal()), /^Error: connector unavailable$/);
});
test('pre-aborted request never calls transport', async () => {
  const controller = new AbortController(); controller.abort();
  let calls = 0;
  await assert.rejects(createGitHubReader('fixture', async () => { calls++; return response(); })(request, controller.signal), /cancelled/);
  assert.equal(calls, 0);
});
test('discards response after abort even if connector ignores signal', async () => {
  const controller = new AbortController();
  const reader = createGitHubReader('fixture', async () => { controller.abort(); return response(row); });
  await assert.rejects(reader(request, controller.signal), /cancelled/);
});
