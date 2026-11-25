import { mkdtempSync, readFileSync, writeFileSync, chmodSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openReceiptStore, type Receipt } from './receipt-store.ts';
let checks = 0;
function eq(a: unknown,b: unknown) { if(JSON.stringify(a)!==JSON.stringify(b)) throw new Error('unexpected result'); checks++; }
function rejects(fn:()=>unknown) { try { fn(); } catch { checks++; return; } throw new Error('expected rejection'); }
const dir=mkdtempSync(join(tmpdir(),'core-receipt-fixture-'));
const key=Buffer.alloc(32,7);
const receipt: Receipt={handle:'receipt:one',owner:'fixture',repositoryId:'1',decision:'adopt',revision:'a'.repeat(40),observedAt:10,expiresAt:30};
try {
  const store=openReceiptStore(dir,'fixture',key,20);
  eq(store.read(receipt.handle,20),undefined);
  store.put(receipt,20);
  eq(store.read(receipt.handle,20),receipt);
  eq(openReceiptStore(dir,'fixture',key,20).read(receipt.handle,20),receipt);
  eq(openReceiptStore(dir,'other',key,20).read(receipt.handle,20),undefined);
  eq(openReceiptStore(dir,'fixture',Buffer.alloc(32,8),20).read(receipt.handle,20),undefined);
  eq(store.read(receipt.handle,30),undefined);
  eq(store.read(receipt.handle,9),undefined);
  eq(store.read('receipt:../one',20),undefined);
  rejects(()=>store.put({...receipt,decision:'defer'},20));
  eq(store.read(receipt.handle,20),receipt);
  rejects(()=>store.put({...receipt,handle:'receipt:two',owner:'other'},20));
  rejects(()=>store.put({...receipt,handle:'receipt:two',expiresAt:31},20));
  rejects(()=>openReceiptStore(dir,'fixture',Buffer.alloc(31),20));
  const file=join(dir,'one.json');
  const original=readFileSync(file,'utf8');
  writeFileSync(file,original.replace('adopt','defer'));
  eq(store.read(receipt.handle,20),undefined);
  writeFileSync(file,original);
  chmodSync(file,0o644);
  eq(store.read(receipt.handle,20),undefined);
  chmodSync(file,0o600);
  symlinkSync(file,join(dir,'two.json'));
  eq(store.read('receipt:two',20),undefined);
  chmodSync(dir,0o755);
  rejects(()=>openReceiptStore(dir,'fixture',key,20));
  eq(store.read(receipt.handle,20),undefined);
  console.log(`receipt store: ${checks} fixture checks passed`);
} finally { chmodSync(dir,0o700); rmSync(dir,{recursive:true,force:true}); }
