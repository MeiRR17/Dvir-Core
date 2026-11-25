import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openReceiptStore, type Receipt } from './receipt-store.ts';
let checks = 0;
function eq(a: unknown,b: unknown) { if(JSON.stringify(a)!==JSON.stringify(b)) throw new Error('unexpected result'); checks++; }
function rejects(fn:()=>unknown) { try { fn(); } catch { checks++; return; } throw new Error('expected rejection'); }
const dir=mkdtempSync(join(tmpdir(),'core-hardening-fixture-'));
const key=Buffer.alloc(32,7);
const receipt: Receipt={handle:'receipt:one',owner:'fixture',repositoryId:'1',decision:'adopt',revision:'a'.repeat(40),observedAt:10,expiresAt:30};
try {
  const store=openReceiptStore(dir,'fixture',key,20);
  for (const field of ['handle','owner','repositoryId','decision','revision']) {
    rejects(()=>store.put({...receipt,[field]:{toString:()=>String(receipt[field as keyof Receipt])}} as Receipt,20));
  }
  rejects(()=>store.put({...receipt,repositoryId:1} as unknown as Receipt,20));
  rejects(()=>openReceiptStore(dir,'fixture','x'.repeat(32) as unknown as Uint8Array,20));
  eq(store.read({toString:()=>receipt.handle} as unknown as string,20),undefined);
  writeFileSync(join(dir,'big.json'),Buffer.alloc(4097),{mode:0o600});
  eq(store.read('receipt:big',20),undefined);
  store.put(receipt,20);
  rejects(()=>store.put(receipt,20));
  eq(openReceiptStore(dir,'fixture',key,20).read(receipt.handle,20),receipt);
  rejects(()=>store.put({...receipt,decision:'defer'},20));
  eq(store.read(receipt.handle,20),receipt);
  console.log(`receipt hardening: ${checks} fixture checks passed`);
} finally { rmSync(dir,{recursive:true,force:true}); }
