import { opendir } from 'node:fs/promises';
import { isAbsolute } from 'node:path';

const packages = ['mlx', 'mlx_lm', 'mlx_vlm'] as const;
type Package = typeof packages[number];
type Presence = 'present' | 'absent' | 'ambiguous' | 'unknown';
export type MlxInventory = { provider: 'mlx'; state: 'observed' | 'unavailable' | 'entry_limit'; packages: Record<Package, Presence>; benchmark: 'not_measured' };
const MAX_ENTRIES = 10000;
function unknown(state: 'unavailable' | 'entry_limit'): MlxInventory {
  return { provider: 'mlx', state, packages: { mlx: 'unknown', mlx_lm: 'unknown', mlx_vlm: 'unknown' }, benchmark: 'not_measured' };
}
// Explicitly approved site-packages directory only. Inspect dist-info names,
// not package code, .pth files, model caches or metadata contents. No imports.
// Presence is directory evidence, not proof that a package can be imported.
export async function probeMlxMetadata(directory: string, limit = MAX_ENTRIES): Promise<MlxInventory> {
  if (typeof directory !== 'string' || !isAbsolute(directory) || !Number.isSafeInteger(limit) || limit < 1 || limit > MAX_ENTRIES) throw new Error('invalid MLX probe configuration');
  const counts: Record<Package, number> = { mlx: 0, mlx_lm: 0, mlx_vlm: 0 };
  const suspect = new Set<Package>();
  let seen = 0;
  try {
    const dir = await opendir(directory);
    for await (const entry of dir) {
      if (++seen > limit) return unknown('entry_limit');
      for (const pkg of packages) {
        const prefix = `${pkg}-`;
        const name = entry.name.toLowerCase();
        if (!name.startsWith(prefix) || !name.endsWith('.dist-info')) continue;
        const version = name.slice(prefix.length, -'.dist-info'.length);
        if (!entry.isDirectory() || !/^[0-9][a-z0-9.!+_]{0,127}$/.test(version)) suspect.add(pkg);
        else counts[pkg]++;
      }
    }
  } catch { return unknown('unavailable'); }
  const presence = (pkg: Package): Presence => suspect.has(pkg) ? 'unknown' : counts[pkg] > 1 ? 'ambiguous' : counts[pkg] === 1 ? 'present' : 'absent';
  return { provider: 'mlx', state: 'observed', packages: { mlx: presence('mlx'), mlx_lm: presence('mlx_lm'), mlx_vlm: presence('mlx_vlm') }, benchmark: 'not_measured' };
}
