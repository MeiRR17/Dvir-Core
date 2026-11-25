import { request } from 'node:http';
import { summarizeOllamaInventory, type RuntimeSummary } from './ollama-inventory.ts';
export type ProbeState = 'observed' | 'timeout' | 'http_error' | 'transport_error' | 'invalid_response' | 'too_large';
export type LocalProbe = { inventory: RuntimeSummary; tags: ProbeState; ps: ProbeState };
export type ApprovedOllamaPortResolver = () => number;
type Result = { state: ProbeState; value: unknown };
const MAX_BYTES = 1024 * 1024;

function read(port: number, path: '/api/tags' | '/api/ps', deadlineMs: number): Promise<Result> {
  return new Promise(resolve => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout>;
    const finish = (state: ProbeState, value: unknown = null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ state, value });
    };
    const req = request({ hostname: '127.0.0.1', port, path, method: 'GET', agent: false, headers: { accept: 'application/json' } }, res => {
      if (settled) { res.destroy(); return; }
      if (res.statusCode !== 200) { finish('http_error'); res.destroy(); return; }
      const chunks: Buffer[] = [];
      let size = 0;
      res.on('data', (chunk: Buffer) => {
        if (settled) return;
        size += chunk.length;
        if (size > MAX_BYTES) { finish('too_large'); res.destroy(); return; }
        chunks.push(chunk);
      });
      res.on('error', () => finish('transport_error'));
      res.on('aborted', () => finish('transport_error'));
      res.on('end', () => {
        if (settled) return;
        try {
          const value: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          if (value === null) throw new Error('invalid response');
          if (path === '/api/tags') summarizeOllamaInventory(value, null);
          else summarizeOllamaInventory(null, value);
          finish('observed', value);
        } catch { finish('invalid_response'); }
      });
    });
    req.on('error', () => finish('transport_error'));
    timer = setTimeout(() => { finish('timeout'); req.destroy(); }, deadlineMs);
    req.end();
  });
}

// Endpoint authority is injected from owner-controlled local configuration.
// The public probe accepts only a deadline; callers cannot choose a raw port.
// Fixed IPv4 loopback and GET-only endpoints; no redirects, credentials, proxy,
// generation, model loading, or cloud fallback.
export function createLocalOllamaProbe(resolveApprovedPort: ApprovedOllamaPortResolver) {
  if (typeof resolveApprovedPort !== 'function') throw new Error('invalid Ollama endpoint resolver');
  return async function probeLocalOllama(deadlineMs = 2000): Promise<LocalProbe> {
    if (!Number.isSafeInteger(deadlineMs) || deadlineMs < 1 || deadlineMs > 10000) throw new Error('invalid local probe configuration');
    let port: number;
    try { port = resolveApprovedPort(); } catch { throw new Error('approved Ollama endpoint unavailable'); }
    if (!Number.isSafeInteger(port) || port < 1 || port > 65535) throw new Error('invalid approved Ollama endpoint');
    const tags = await read(port, '/api/tags', deadlineMs);
    const ps = await read(port, '/api/ps', deadlineMs);
    return { inventory: summarizeOllamaInventory(tags.value, ps.value), tags: tags.state, ps: ps.state };
  };
}
