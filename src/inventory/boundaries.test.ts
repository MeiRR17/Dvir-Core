import { capabilities, resolveBoundary, checkOwnership } from './boundaries.ts';
function equal(a: unknown, b: unknown): void { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error('unexpected result'); }
let cases = 0;
const owners = ['dvir-os', 'apex-pci', 'corpora', 'neo4j', 'autopilot', 'existing-terminal-mcp', 'hermes', 'core'];
for (const [index, capability] of capabilities.entries()) {
  const boundary = resolveBoundary(capability)!;
  equal(boundary.owner, owners[index]);
  equal(checkOwnership(capability, boundary.owner), 'declared_owner');
  equal(checkOwnership(capability, 'untrusted'), 'owner_mismatch');
  cases += 3;
}
for (const invalid of ['constructor', '__proto__', 'toString', '', null, {}]) {
  equal(resolveBoundary(invalid), undefined);
  equal(checkOwnership(invalid, 'core'), 'unknown_capability');
  cases += 2;
}
equal(checkOwnership('project_status', 'core'), 'owner_mismatch');
equal(checkOwnership('terminal_execution', 'core'), 'owner_mismatch');
const copy = resolveBoundary('product')!;
Object.assign(copy, { owner: 'core' });
equal(resolveBoundary('product')?.owner, 'dvir-os');
console.log(`boundary fixture: ${cases + 3} checks passed`);
