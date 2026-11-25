export type TransportFailure = 'rate_limit' | 'denied' | 'transport_error' | 'timeout';
export class PageReadError extends Error {
  readonly kind: TransportFailure;
  constructor(kind: TransportFailure) { super(kind); this.kind = kind; }
}

// Abort is cooperative; a reader that ignores the signal can outlive the timeout.
// No retry is attempted, and a late result never becomes a successful receipt.
export async function withPageDeadline<T>(read: (signal: AbortSignal) => Promise<T>, timeoutMs: number): Promise<T> {
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 120_000) throw new Error('invalid deadline');
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new PageReadError('timeout'));
        controller.abort();
      }, timeoutMs);
    });
    return await Promise.race([timeout, Promise.resolve().then(() => read(controller.signal))]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}
export function classifyPageError(error: unknown): TransportFailure {
  if (error instanceof PageReadError && ['rate_limit', 'denied', 'transport_error', 'timeout'].includes(error.kind)) return error.kind;
  return 'transport_error';
}
