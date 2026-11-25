export type Provider = 'ollama' | 'mlx';
export type BenchmarkSummary = Readonly<{
  provider: Provider; source: 'fixture' | 'local';
  samples: number; medianFirstTokenMs: number; medianTokensPerSecond: number;
  peakProcessBytes: number | null; structuredSuccesses: number | null;
  toolSuccesses: number | null;
}>;
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid benchmark');
  return value as Record<string, unknown>;
}
function integer(value: unknown, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max) throw new Error('invalid benchmark');
  return value;
}
function median(values: number[]): number {
  values.sort((a, b) => a - b);
  const mid = Math.floor(values.length / 2);
  return values.length % 2 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
}
// A caller-supplied evidence label is not proof of actual execution.
// Throughput uses completion tokens divided by the caller's measured decode window.
// No prompts, model IDs or per-sample records escape this reducer.
export function summarizeBenchmark(input: unknown): BenchmarkSummary | null {
  if (input === null) return null;
  const { provider, source, samples } = object(input);
  if ((provider !== 'ollama' && provider !== 'mlx') || (source !== 'fixture' && source !== 'local') || !Array.isArray(samples) || samples.length < 1 || samples.length > 100) throw new Error('invalid benchmark');
  const first: number[] = [], rates: number[] = [], memory: number[] = [];
  const structured: boolean[] = [], tools: boolean[] = [];
  for (const raw of samples) {
    const row = object(raw);
    first.push(integer(row.firstTokenMs, 0, 3600000));
    const decodeMs = integer(row.decodeMs, 1, 3600000);
    rates.push(integer(row.completionTokens, 1, 1000000) * 1000 / decodeMs);
    if (row.peakProcessBytes !== null) memory.push(integer(row.peakProcessBytes, 0, Number.MAX_SAFE_INTEGER));
    for (const [key, target] of [['structuredSuccess', structured], ['toolSuccess', tools]] as const) {
      const value = row[key];
      if (value !== null) {
        if (typeof value !== 'boolean') throw new Error('invalid benchmark');
        target.push(value);
      }
    }
  }
  // Never turn partial observations into complete success rates or peak claims.
  return { provider, source, samples: samples.length, medianFirstTokenMs: median(first), medianTokensPerSecond: median(rates),
    peakProcessBytes: memory.length === samples.length ? Math.max(...memory) : null,
    structuredSuccesses: structured.length === samples.length ? structured.filter(Boolean).length : null,
    toolSuccesses: tools.length === samples.length ? tools.filter(Boolean).length : null };
}
