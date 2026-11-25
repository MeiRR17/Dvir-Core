export type ReadFailure = 'deadline' | 'rate_limited' | 'denied' | 'transport_error';
export class PageReadError extends Error {
  readonly code: ReadFailure;
  constructor(code: ReadFailure) { super(code); this.code = code; }
}
export function classifyReadError(error: unknown): ReadFailure {
  if (error instanceof PageReadError && ['deadline', 'rate_limited', 'denied', 'transport_error'].includes(error.code)) return error.code;
  return 'transport_error';
}
// A timed-out transport may ignore AbortSignal; never retry or start another page after failure.
export async function readWithDeadline<T>(read: (signal: AbortSignal) => Promise<T>, deadlineMs: number): Promise<T> {
  if (!Number.isSafeInteger(deadlineMs) || deadlineMs < 1 || deadlineMs > 60_000) throw new Error('invalid deadline');
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timer = setTimeout(() => { reject(new PageReadError('deadline')); controller.abort(); }, deadlineMs);
  });
  try { return await Promise.race([deadline, Promise.resolve().then(() => read(controller.signal))]); }
  finally { if (timer !== undefined) clearTimeout(timer); }
}
