import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, realpath, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createMlxMetadataProbe } from './mlx-inventory.ts';

async function fixture(run: (root: string) => Promise<void>) {
  const root = await mkdtemp(join(tmpdir(), 'mlx-fixture-'));
  try { await run(await realpath(root)); } finally { await rm(root, { recursive: true, force: true }); }
}
const probe = (directory: string) => createMlxMetadataProbe(handle => handle === 'python-main' ? directory : undefined);

test('empty approved directory is observed absence', () => fixture(async root => {
  assert.deepEqual(await probe(root)('python-main'), { provider: 'mlx', state: 'observed', packages: { mlx: 'absent', mlx_lm: 'absent', mlx_vlm: 'absent' }, benchmark: 'not_measured' });
}));
test('normalized distributions detected without reading contents', () => fixture(async root => {
  for (const name of ['mlx-0.30.1.dist-info', 'MLX_LM-0.29.0+local.dist-info', 'mlx_vlm-1.0rc1.dist-info', 'unrelated-1.dist-info']) await mkdir(join(root, name));
  await writeFile(join(root, 'danger.pth'), 'raise RuntimeError()');
  const result = await probe(root)('python-main');
  assert.deepEqual(result.packages, { mlx: 'present', mlx_lm: 'present', mlx_vlm: 'present' });
  assert.doesNotMatch(JSON.stringify(result), /0\.30|local|fixture|danger/);
}));
test('multiple versions remain ambiguous', () => fixture(async root => {
  await mkdir(join(root, 'mlx-1.dist-info')); await mkdir(join(root, 'mlx-2.dist-info'));
  assert.equal((await probe(root)('python-main')).packages.mlx, 'ambiguous');
}));
test('symlinked child and malformed distribution are unknown', () => fixture(async root => {
  await mkdir(join(root, 'target')); await symlink(join(root, 'target'), join(root, 'mlx-1.dist-info'));
  await writeFile(join(root, 'mlx_lm-1.dist-info'), ''); await mkdir(join(root, 'mlx_vlm-invalid.dist-info'));
  assert.deepEqual((await probe(root)('python-main')).packages, { mlx: 'unknown', mlx_lm: 'unknown', mlx_vlm: 'unknown' });
}));
test('symlinked supplied root is rejected', () => fixture(async root => {
  const alias = join(root, 'root-alias'); await symlink(root, alias);
  const result = await probe(alias)('python-main');
  assert.equal(result.state, 'unavailable'); assert.deepEqual(Object.values(result.packages), ['unknown', 'unknown', 'unknown']);
}));
test('symlinked ancestor is rejected', () => fixture(async root => {
  const realParent = join(root, 'real-parent'); const realSite = join(realParent, 'site-packages');
  await mkdir(realSite, { recursive: true });
  const alias = join(root, 'parent-alias'); await symlink(realParent, alias);
  const result = await probe(join(alias, 'site-packages'))('python-main');
  assert.equal(result.state, 'unavailable'); assert.deepEqual(Object.values(result.packages), ['unknown', 'unknown', 'unknown']);
}));
test('entry limit never returns partial absence', () => fixture(async root => {
  await mkdir(join(root, 'mlx-1.dist-info')); await mkdir(join(root, 'other'));
  assert.equal((await probe(root)('python-main', 2)).state, 'observed');
  const result = await probe(root)('python-main', 1);
  assert.equal(result.state, 'entry_limit'); assert.deepEqual(Object.values(result.packages), ['unknown', 'unknown', 'unknown']);
}));
test('unknown environment handle and resolver failure fail closed', () => fixture(async root => {
  assert.equal((await probe(root)('not-configured')).state, 'unavailable');
  assert.equal((await createMlxMetadataProbe(() => { throw new Error('private'); })('python-main')).state, 'unavailable');
}));
test('invalid handles, roots and limits rejected or fail closed', async () => {
  const p = createMlxMetadataProbe(() => '/tmp');
  for (const handle of ['', '../private', '/tmp']) await assert.rejects(p(handle), /invalid MLX probe configuration/);
  for (const limit of [0, 10001, 1.5]) await assert.rejects(p('python-main', limit), /invalid MLX probe configuration/);
  assert.equal((await createMlxMetadataProbe(() => 'relative')('python-main')).state, 'unavailable');
  assert.equal((await createMlxMetadataProbe(() => '/')('python-main')).state, 'unavailable');
});
