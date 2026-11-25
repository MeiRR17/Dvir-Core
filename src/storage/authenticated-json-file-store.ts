import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { closeSync, constants, fstatSync, fsyncSync, linkSync, lstatSync, openSync, readSync, unlinkSync, writeFileSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
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
export function openAuthenticatedJsonFileStore(directory: string, secret: Uint8Array, domain: string, maxBytes: number) {
  if (typeof directory !== 'string' || !isAbsolute(directory) || !(secret instanceof Uint8Array) || secret.byteLength < 32 || typeof domain !== 'string' || domain.length < 1 || domain.length > 128 || !Number.isSafeInteger(maxBytes) || maxBytes < 128 || maxBytes > 65536) throw new Error('invalid authenticated file store configuration');
  const key = Buffer.from(secret);
  function checkDirectory() {
    const stat = lstatSync(directory);
    const uid = process.getuid?.();
    if (!stat.isDirectory() || (stat.mode & 0o077) !== 0 || (uid !== undefined && stat.uid !== uid)) throw new Error('unsafe authenticated file directory');
  }
  function target(name: string) {
    if (typeof name !== 'string' || !filenamePattern.test(name)) throw new Error('invalid authenticated filename');
    return join(directory, name);
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
      const temp = join(directory, '.tmp-' + randomBytes(16).toString('hex'));
      const fd = openSync(temp, 'wx', 0o600);
      let publication: AuthenticatedPublicationState = 'not_published';
      let failed = false;
      try {
        try { writeFileSync(fd, bytes); fsyncSync(fd); } finally { closeSync(fd); }
        linkSync(temp, destination);
        publication = 'published_unconfirmed';
        const dir = openSync(directory, constants.O_RDONLY);
        try { fsyncSync(dir); publication = 'durable'; } finally { closeSync(dir); }
      } catch {
        failed = true;
      } finally {
        try { unlinkSync(temp); } catch { failed = true; }
      }
      // On any write error, callers must read and validate the handle before retrying.
      // publication describes this attempt; "durable" means directory fsync succeeded.
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
        if (!envelope || typeof envelope !== 'object' || envelope.version !== 1 || typeof envelope.payload !== 'string' || typeof envelope.mac !== 'string' || !/^[a-f0-9]{64}$/.test(envelope.mac)) return undefined;
        if (!timingSafeEqual(Buffer.from(envelope.mac, 'hex'), Buffer.from(mac(envelope.payload), 'hex'))) return undefined;
        return envelope.payload;
      } catch { return undefined; }
    },
  };
}
