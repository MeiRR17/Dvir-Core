import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { openAuthenticatedJsonFileStore } from './authenticated-json-file-store.ts';

const key = Buffer.alloc(32, 4);
const domain = 'dvir-core:fault-injection:v1\0';
function fixture(run: (root: string) => Promise<void>) {
  return async () => {
    const root = mkdtempSync(join(tmpdir(), 'auth-json-fault-'));
    try { await run(root); } finally { rmSync(root, { recursive: true, force: true }); }
  };
}
function childScript(root: string, helperUrl: string, mode: 'crash' | 'fail', fsyncAt: 1 | 2) {
  const lines = [
    "import fs from 'node:fs';",
    "import { syncBuiltinESMExports } from 'node:module';",
    'const realFsync = fs.fsyncSync.bind(fs);',
    'let calls = 0;',
    'fs.fsyncSync = fd => {',
    '  calls++;',
    "  if (" + JSON.stringify(mode) + " === 'crash' && calls === " + fsyncAt + ") {",
    "    process.stdout.write('READY\\n');",
    '    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0);',
    '  }',
    "  if (" + JSON.stringify(mode) + " === 'fail' && calls === " + fsyncAt + ") throw new Error('injected fsync failure');",
    '  return realFsync(fd);',
    '};',
    'syncBuiltinESMExports();',
    'const { openAuthenticatedJsonFileStore } = await import(' + JSON.stringify(helperUrl) + ');',
    'const store = openAuthenticatedJsonFileStore(' + JSON.stringify(root) + ', Buffer.alloc(32, 4), ' + JSON.stringify(domain) + ', 4096);',
    "try { store.write('run.json', 'payload'); process.stdout.write('DONE\\n'); }",
    "catch (error) { process.stdout.write('THREW:' + (error?.publication ?? 'unknown') + '\\n'); }",
  ];
  return lines.join('\n');
}
async function runChild(root: string, mode: 'crash' | 'fail', fsyncAt: 1 | 2) {
  // @ts-ignore Node syntax detection executes this stripped .ts test as ESM.
  const helperUrl = new URL('./authenticated-json-file-store.ts', import.meta.url).href;
  const child = spawn(process.execPath, ['--experimental-strip-types', '--input-type=module', '-e', childScript(root, helperUrl, mode, fsyncAt)], { stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '', stderr = '';
  child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8');
  child.stdout.on('data', chunk => { stdout += chunk; });
  child.stderr.on('data', chunk => { stderr += chunk; });
  if (mode === 'crash') {
    await new Promise<void>((resolve, reject) => {
      const onData = (chunk: string) => { if ((stdout + chunk).includes('READY')) { child.stdout.off('data', onData); resolve(); } };
      child.stdout.on('data', onData);
      child.once('error', reject);
      child.once('exit', (code, signal) => reject(new Error('child exited before crash barrier: ' + code + '/' + signal + ' ' + stderr)));
    });
    child.kill('SIGKILL');
    const [code, signal] = await once(child, 'exit');
    assert.equal(code, null); assert.equal(signal, 'SIGKILL');
  } else {
    const [code, signal] = await once(child, 'exit');
    assert.equal(code, 0); assert.equal(signal, null);
    assert.match(stdout, new RegExp('THREW:' + (fsyncAt === 1 ? 'not_published' : 'published_unconfirmed')));
  }
  return { stdout, stderr };
}

test('SIGKILL before file fsync leaves only an ignored orphan; a fresh publication recovers', fixture(async root => {
  await runChild(root, 'crash', 1);
  const names = readdirSync(root);
  assert.equal(names.length, 1); assert.match(names[0], /^\.tmp-[a-f0-9]{32}$/);
  const store = openAuthenticatedJsonFileStore(root, key, domain, 4096);
  assert.equal(store.read('run.json'), undefined);
  store.write('run.json', 'recovered');
  assert.equal(store.read('run.json'), 'recovered');
  assert.equal(readdirSync(root).length, 2);
}));

test('SIGKILL after hard-link publication leaves a verifiable target and orphan; recovery reads before retry', fixture(async root => {
  await runChild(root, 'crash', 2);
  const names = readdirSync(root);
  assert.equal(names.length, 2);
  assert.ok(names.includes('run.json'));
  assert.equal(names.filter(name => name.startsWith('.tmp-')).length, 1);
  const store = openAuthenticatedJsonFileStore(root, key, domain, 4096);
  assert.equal(store.read('run.json'), 'payload');
  assert.throws(() => store.write('run.json', 'duplicate'));
  assert.equal(store.read('run.json'), 'payload');
}));

test('file fsync failure removes the unpublished temporary file', fixture(async root => {
  await runChild(root, 'fail', 1);
  assert.deepEqual(readdirSync(root), []);
  assert.equal(openAuthenticatedJsonFileStore(root, key, domain, 4096).read('run.json'), undefined);
}));

test('directory fsync failure reports an ambiguous result but leaves a readable immutable publication', fixture(async root => {
  await runChild(root, 'fail', 2);
  assert.deepEqual(readdirSync(root), ['run.json']);
  const store = openAuthenticatedJsonFileStore(root, key, domain, 4096);
  assert.equal(store.read('run.json'), 'payload');
  assert.throws(() => store.write('run.json', 'retry'));
  assert.equal(store.read('run.json'), 'payload');
  assert.equal(statSync(join(root, 'run.json')).mode & 0o777, 0o600);
}));
