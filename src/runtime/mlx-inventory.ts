import { lstat, opendir, realpath } from 'node:fs/promises';
import { isAbsolute, join, parse, resolve, sep } from 'node:path';

const packages = ['mlx', 'mlx_lm', 'mlx_vlm'] as const;
type Package = typeof packages[number];
type Presence = 'present' | 'absent' | 'ambiguous' | 'unknown';
export type MlxInventory = { provider: 'mlx'; state: 'observed' | 'unavailable' | 'entry_limit'; packages: Record<Package, Presence>; benchmark: 'not_measured' };
export type ApprovedMlxEnvironmentResolver = (environmentHandle: string) => string | undefined;
const MAX_ENTRIES = 10000;
const handlePattern = /^[a-zA-Z0-9_-]{1,80}$/;
function unknown(state: 'unavailable' | 'entry_limit'): MlxInventory {
  return { provider: 'mlx', state, packages: { mlx: 'unknown', mlx_lm: 'unknown', mlx_vlm: 'unknown' }, benchmark: 'not_measured' };
}

async function hasSymlinkedPathComponent(directory: string): Promise<boolean> {
  const absolute = resolve(directory);
  const root = parse(absolute).root;
  let current = root;
  for (const part of absolute.slice(root.length).split(sep).filter(Boolean)) {
    current = join(current, part);
    const stat = await lstat(current);
    if (stat.isSymbolicLink()) return true;
    if (current !== absolute && !stat.isDirectory()) return true;
  }
  return false;
}

// The resolver is constructed from owner-controlled local environment configuration.
// Callers provide an opaque handle, never an arbitrary filesystem path. Static lstat
// and realpath checks reject symlink roots/ancestors, but cannot eliminate TOCTOU races;
// production host use still requires a descriptor-relative/openat-capable boundary.
export function createMlxMetadataProbe(resolveApprovedSitePackages: ApprovedMlxEnvironmentResolver) {
  if (typeof resolveApprovedSitePackages !== 'function') throw new Error('invalid MLX environment resolver');
  return async function probeMlxMetadata(environmentHandle: string, limit = MAX_ENTRIES): Promise<MlxInventory> {
    if (typeof environmentHandle !== 'string' || !handlePattern.test(environmentHandle) || !Number.isSafeInteger(limit) || limit < 1 || limit > MAX_ENTRIES) throw new Error('invalid MLX probe configuration');
    let directory: string | undefined;
    try { directory = resolveApprovedSitePackages(environmentHandle); } catch { return unknown('unavailable'); }
    if (typeof directory !== 'string' || !isAbsolute(directory)) return unknown('unavailable');
    const absolute = resolve(directory);
    try {
      if (await hasSymlinkedPathComponent(absolute)) return unknown('unavailable');
      if (await realpath(absolute) !== absolute) return unknown('unavailable');
      const counts: Record<Package, number> = { mlx: 0, mlx_lm: 0, mlx_vlm: 0 };
      const suspect = new Set<Package>();
      let seen = 0;
      const dir = await opendir(absolute);
      for await (const entry of dir) {
        if (++seen > limit) return unknown('entry_limit');
        for (const pkg of packages) {
          const prefix = pkg + '-';
          const name = entry.name.toLowerCase();
          if (!name.startsWith(prefix) || !name.endsWith('.dist-info')) continue;
          const version = name.slice(prefix.length, -'.dist-info'.length);
          if (!entry.isDirectory() || !/^[0-9][a-z0-9.!+_]{0,127}$/.test(version)) suspect.add(pkg);
          else counts[pkg]++;
        }
      }
      const presence = (pkg: Package): Presence => suspect.has(pkg) ? 'unknown' : counts[pkg] > 1 ? 'ambiguous' : counts[pkg] === 1 ? 'present' : 'absent';
      return { provider: 'mlx', state: 'observed', packages: { mlx: presence('mlx'), mlx_lm: presence('mlx_lm'), mlx_vlm: presence('mlx_vlm') }, benchmark: 'not_measured' };
    } catch { return unknown('unavailable'); }
  };
}
