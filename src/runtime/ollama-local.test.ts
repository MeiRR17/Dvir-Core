import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, type RequestListener } from 'node:http';
import { createLocalOllamaProbe } from './ollama-local.ts';
async function fixture(handler: RequestListener, run: (port: number) => Promise<void>) {
  const server = createServer(handler);
  await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  try { const address = server.address(); if (!address || typeof address === 'string') throw new Error('missing port'); await run(address.port); }
  finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
}
const probe = (port: number) => createLocalOllamaProbe(() => port);
const empty = JSON.stringify({ models: [] });
const model = { name: 'private-fixture', digest: 'a'.repeat(64), size: 10, size_vram: 2 };
test('only two GET paths, aggregate output', () => fixture((req,res) => {
  assert.equal(req.method,'GET'); assert.equal(req.headers.authorization,undefined);
  assert.ok(req.url === '/api/tags' || req.url === '/api/ps');
  res.end(JSON.stringify({ models: [model] }));
}, async port => { const r = await probe(port)(); assert.equal(r.tags,'observed'); assert.equal(r.ps,'observed'); assert.equal(r.inventory.running?.reportedVramBytes,2); assert.doesNotMatch(JSON.stringify(r),/private-fixture/); }));
test('empty is observed, invalid is unavailable', () => fixture((req,res) => res.end(req.url === '/api/tags' ? empty : 'null'), async port => {
  const r = await probe(port)(); assert.equal(r.tags,'observed'); assert.equal(r.inventory.listed?.entries,0); assert.equal(r.ps,'invalid_response'); assert.equal(r.inventory.running,null);
}));
test('redirect is not followed', () => fixture((req,res) => { assert.ok(req.url === '/api/tags' || req.url === '/api/ps'); res.writeHead(302,{location:'/api/generate'}); res.end(); }, async port => { const r = await probe(port)(); assert.equal(r.tags,'http_error'); assert.equal(r.ps,'http_error'); }));
test('hard streamed body bound', () => fixture((req,res) => { if(req.url === '/api/tags')res.end(Buffer.alloc(1024*1024+1)); else res.end(empty); }, async port => { const r = await probe(port)(); assert.equal(r.tags,'too_large'); assert.equal(r.ps,'observed'); }));
test('absolute deadline also covers stalled response body', () => fixture((req,res) => { if(req.url === '/api/tags'){res.writeHead(200);res.write('{');} else res.end(empty); }, async port => { const r = await probe(port)(50); assert.equal(r.tags,'timeout'); assert.equal(r.ps,'observed'); }));
test('malformed JSON and schema rejected without private error', () => fixture((req,res) => res.end(req.url === '/api/tags' ? 'private-secret' : JSON.stringify({models:[{name:'bad'}]})), async port => { const r = await probe(port)(); assert.equal(r.tags,'invalid_response'); assert.equal(r.ps,'invalid_response'); assert.doesNotMatch(JSON.stringify(r),/private-secret/); }));
test('abrupt disconnect classified', () => fixture((req,res) => { req.socket.destroy(); }, async port => { const r = await probe(port)(); assert.equal(r.tags,'transport_error'); assert.equal(r.ps,'transport_error'); }));
test('resolver is trusted configuration and invoked once per probe', () => fixture((req,res) => res.end(empty), async port => {
  let calls = 0; const run = createLocalOllamaProbe(() => { calls++; return port; });
  await run(); assert.equal(calls,1);
  await assert.rejects(run(12345), /invalid local probe configuration/);
}));
test('invalid approved port, resolver error or deadline rejected before network', async () => {
  for (const port of [0,65536,1.5]) await assert.rejects(createLocalOllamaProbe(() => port)(), /invalid approved Ollama endpoint/);
  await assert.rejects(createLocalOllamaProbe(() => { throw new Error('private endpoint detail'); })(), /approved Ollama endpoint unavailable/);
  for (const ms of [0,10001,1.5]) await assert.rejects(createLocalOllamaProbe(() => 11434)(ms), /invalid local probe configuration/);
}));
