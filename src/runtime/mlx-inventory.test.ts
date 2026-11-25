import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { probeMlxMetadata } from './mlx-inventory.ts';
async function fixture(run: (root: string) => Promise<void>) {
  const root = await mkdtemp(join(tmpdir(), 'mlx-fixture-'));
  try { await run(root); } finally { await rm(root, { recursive: true, force: true }); }
}
test('empty directory is observed absence', () => fixture(async root => {
  assert.deepEqual(await probeMlxMetadata(root), { provider: 'mlx', state: 'observed', packages: { mlx: 'absent', mlx_lm: 'absent', mlx_vlm: 'absent' }, benchmark: 'not_measured' });
}));
test('normalized distributions detected without reading contents', () => fixture(async root => {
  for (const name of ['mlx-0.30.1.dist-info', 'MLX_LM-0.29.0+local.dist-info', 'mlx_vlm-1.0rc1.dist-info', 'unrelated-1.dist-info']) await mkdir(join(root, name));
  await writeFile(join(root, 'danger.pth'), 'raise RuntimeError()');
  const result = await probeMlxMetadata(root);
  assert.deepEqual(result.packages, { mlx: 'present', mlx_lm: 'present', mlx_vlm: 'present' });
  assert.doesNotMatch(JSON.stringify(result), /0\.30|local|fixture|danger/);
}));
test('multiple versions remain ambiguous', () => fixture(async root => {
  await mkdir(join(root, 'mlx-1.dist-info')); await mkdir(join(root, 'mlx-2.dist-info'));
  assert.equal((await probeMlxMetadata(root)).packages.mlx, 'ambiguous');
}));
test('symlink, regular file and malformed version are unknown', () => fixture(async root => {
  await mkdir(join(root, 'target')); await symlink(join(root, 'target'), join(root, 'mlx-1.dist-info'));
  await writeFile(join(root, 'mlx_lm-1.dist-info'), ''); await mkdir(join(root, 'mlx_vlm-invalid.dist-info'));
  assert.deepEqual((await probeMlxMetadata(root)).packages, { mlx: 'unknown', mlx_lm: 'unknown', mlx_vlm: 'unknown' });
}));
test('entry limit never returns partial absence', () => fixture(async root => {
  await mkdir(join(root, 'mlx-1.dist-info')); await mkdir(join(root, 'other'));
  assert.equal((await probeMlxMetadata(root, 2)).state, 'observed');
  const result = await probeMlxMetadata(root, 1);
  assert.equal(result.state, 'entry_limit'); assert.deepEqual(Object.values(result.packages), ['unknown', 'unknown', 'unknown']);
}));
test('unavailable directory is not absence', () => fixture(async root => {
  const result = await probeMlxMetadata(join(root, 'missing'));
  assert.equal(result.state, 'unavailable'); assert.equal(result.packages.mlx, 'unknown');
}));
test('invalid configuration rejected', async () => {
  for (const [path, limit] of [['relative', 1], ['/tmp', 0], ['/tmp', 10001], ['/tmp', 1.5]] as const) await assert.rejects(probeMlxMetadata(path, limit), /invalid MLX probe configuration/);
});
