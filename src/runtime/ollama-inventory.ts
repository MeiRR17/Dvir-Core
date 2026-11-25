export type ModelListSummary = Readonly<{ entries: number; distinctDigests: number; reportedBytes: number }>;
export type RunningSummary = ModelListSummary & { reportedVramBytes: number; unmatchedDigests: number | null };
export type RuntimeSummary = { provider: 'ollama'; listed: ModelListSummary | null; running: RunningSummary | null; benchmark: 'not_measured' };
type Model = { name: string; digest: string; size: number; vram: number };
const MAX_ROWS = 1000;
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid model inventory');
  return value as Record<string, unknown>;
}
function bytes(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) throw new Error('invalid model size');
  return value;
}
function models(value: unknown, running: boolean): Model[] {
  const rows = record(value).models;
  if (!Array.isArray(rows) || rows.length > MAX_ROWS) throw new Error('invalid model inventory');
  const names = new Set<string>();
  return rows.map(raw => {
    const row = record(raw);
    if (typeof row.name !== 'string' || !row.name.trim() || row.name.length > 256 || names.has(row.name) || typeof row.digest !== 'string' || !/^[a-f0-9]{64}$/.test(row.digest)) throw new Error('invalid model identity');
    names.add(row.name);
    const size = bytes(row.size);
    const vram = running ? bytes(row.size_vram) : 0;
    return { name: row.name, digest: row.digest, size, vram };
  });
}
function sum(rows: Model[], field: 'size' | 'vram'): number {
  let total = 0;
  for (const row of rows) { total += row[field]; if (!Number.isSafeInteger(total)) throw new Error('model size overflow'); }
  return total;
}
function describe(rows: Model[]): ModelListSummary {
  return { entries: rows.length, distinctDigests: new Set(rows.map(row => row.digest)).size, reportedBytes: sum(rows, 'size') };
}
// Input: documented /api/tags and /api/ps JSON envelopes from an authorized local caller.
// null denotes unavailable/unobserved, not empty. The two responses are not atomic.
// Sums are per-record provider-reported sizes, not measured disk/RAM use; aliases can overlap.
// Output contains no names, digests, paths, raw payloads or benchmark claims.
export function summarizeOllamaInventory(tags: unknown, ps: unknown): RuntimeSummary {
  const listed = tags === null ? null : models(tags, false);
  const running = ps === null ? null : models(ps, true);
  const installed = listed === null ? null : new Set(listed.map(row => row.digest));
  return { provider: 'ollama', listed: listed === null ? null : describe(listed), running: running === null ? null : {
    ...describe(running), reportedVramBytes: sum(running, 'vram'),
    unmatchedDigests: installed === null ? null : new Set(running.filter(row => !installed.has(row.digest)).map(row => row.digest)).size,
  }, benchmark: 'not_measured' };
}
