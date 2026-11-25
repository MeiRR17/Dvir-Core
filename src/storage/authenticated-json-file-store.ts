import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { closeSync, constants, fstatSync, fsyncSync, linkSync, lstatSync, openSync, readSync, realpathSync, unlinkSync, writeFileSync } from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';

const filenamePattern = /^[a-zA-Z0-9_-]{1,80}\.json$/;
export type AuthenticatedPublicationState = 'not_published' | 'published_unconfirmed' | 'durable';

export class AuthenticatedStoreWriteError extends Error {
  readonly publication: AuthenticatedPublicationState;
  constructor(publication: AuthenticatedPublicationState) {
    super('authenticated store write failed (' + publication + ')');
    this.publication = publication;
    this.name = 'AuthenticatedStoreWriteError';
  }
}

function canonicalDirectory(directory: string): string {
  if (typeof directory !== 'string' || !isAbsolute(directory)) throw new Error('invalid authenticated file directory');
  const requested = resolve(directory);
  const input = lstatSync(requested);
  if (!input.isDirectory() || input.isSymbolicLink()) throw new Error('unsafe authenticated file directory');
  return resolve(realpathSync(requested));
}

export function openAuthenticatedJsonFileStore(directory: string, secret: Uint8Array, domain: string, maxBytes: number) {
  if (typeof directory !== 'string' || !isAbsolute(directory) || !(secret instanceof Uint8Array) || secret.byteLength < 32 || typeof domain !== 'string' || domain.length < 1 || domain.length > 128 || !Number.isSafeInteger(maxBytes) || maxBytes < 128 || maxBytes > 65536) throw new Error('invalid authenticated file store configuration');
  const root = canonicalDirectory(directory);
  const key = Buffer.from(secret);

  function checkDirectory() {
    // Re-resolve the pinned canonical path on every operation. This detects a
    // replaced symlinked ancestor; it is not a substitute for openat-style
    // race-free directory handles on platforms where Node does not expose them.
    if (resolve(realpathSync(root)) !== root) throw new Error('unsafe authenticated file directory');
    const stat = lstatSync(root);
    const uid = process.getuid?.();
    if (!stat.isDirectory() || stat.isSymbolicLink() || (stat.mode & 0o077) !== 0 || (uid !== undefined && stat.uid !== uid)) throw new Error('unsafe authenticated file directory');
  }

  function target(name: string) {
    if (typeof name !== 'string' || !filenamePattern.test(name)) throw new Error('invalid authenticated filename');
    return join(root, name);
  }

  const mac = (payload: string) => createHmac('sha256', key).update(domain).update(payload).digest('hex');
  checkDirectory();

  return {
    write(name: string, payload: string): void {
      checkDirectory();
      const destination = target(name);
      if (typeof payload !== 'string') throw new Error('invalid authenticated payload');
      const bytes = Buffer.from(JSON.stringify({ version: 1, payload, mac: mac(payload) }));
      if (bytes.length > maxBytes) throw new Error('authenticated payload too large');
      const temp = join(root, '.tmp-' + randomBytes(16).toString('hex'));
      const fd = openSync(temp, 'wx', 0o600);
      let publication: AuthenticatedPublicationState = 'not_published';
      let failed = false;
      try {
        try { writeFileSync(fd, bytes); fsyncSync(fd); } finally { closeSync(fd); }
        linkSync(temp, destination);
        publication = 'published_unconfirmed';
        const dir = openSync(root, constants.O_RDONLY);
        try { fsyncSync(dir); publication = 'durable'; } finally { closeSync(dir); }
      } catch {
        failed = true;
      } finally {
        try { unlinkSync(temp); } catch { failed = true; }
      }
      if (failed) throw new AuthenticatedStoreWriteError(publication);
    },

    read(name: string): string | undefined {
      try {
        checkDirectory();
        const fd = openSync(target(name), constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
        let text: string;
        try {
          const stat = fstatSync(fd);
          const uid = process.getuid?.();
          if (!stat.isFile() || stat.size > maxBytes || (stat.mode & 0o077) !== 0 || (uid !== undefined && stat.uid !== uid)) return undefined;
          const buffer = Buffer.alloc(maxBytes + 1);
          let total = 0;
          while (total < buffer.length) {
            const count = readSync(fd, buffer, total, buffer.length - total, null);
            if (!count) break;
            total += count;
          }
          if (total > maxBytes) return undefined;
          text = buffer.subarray(0, total).toString('utf8');
        } finally { closeSync(fd); }
        if (Buffer.byteLength(text) > maxBytes) return undefined;
        const envelope = JSON.parse(text);
        if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope) || envelope.version !== 1 || typeof envelope.payload !== 'string' || typeof envelope.mac !== 'string' || !/^[a-f0-9]{64}$/.test(envelope.mac)) return undefined;
        if (!timingSafeEqual(Buffer.from(envelope.mac, 'hex'), Buffer.from(mac(envelope.payload), 'hex'))) return undefined;
        return envelope.payload;
      } catch { return undefined; }
    },
  };
}
