import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { summarizeInventory } from '../src/inventory.ts';
const repo = (owner: string, name: string, archived = false) => ({ owner, name, archived });
test('scope, deduplication and counts only', () => {
  const result = summarizeInventory('Owner', [
    { repositories: [repo('owner', 'private-name'), repo('other', 'excluded')], complete: false },
    { repositories: [repo('OWNER', 'PRIVATE-NAME'), repo('owner', 'old', true)], complete: true },
  ]);
  assert.deepEqual(result, { coverage: 'complete', personal: 2, archived: 1, active: 1 });
  assert.ok(!JSON.stringify(result).includes('private-name'));
});
test('empty or interrupted pagination is partial', () => {
  assert.equal(summarizeInventory('owner', []).coverage, 'partial');
  assert.equal(summarizeInventory('owner', [{ repositories: [], complete: false }]).coverage, 'partial');
});
test('confirmed empty inventory is complete', () => {
  assert.deepEqual(summarizeInventory('owner', [{ repositories: [], complete: true }]), { coverage: 'complete', personal: 0, archived: 0, active: 0 });
});
test('contradictory observations and pages fail closed', () => {
  assert.throws(() => summarizeInventory('owner', [{ repositories: [repo('owner', 'x'), repo('owner', 'X', true)], complete: true }]));
  assert.throws(() => summarizeInventory('owner', [{ repositories: [], complete: true }, { repositories: [], complete: false }]));
});
test('invalid scoped input is rejected', () => {
  assert.throws(() => summarizeInventory('owner', [{ repositories: [repo('owner', 'a/b')], complete: true }]));
  assert.throws(() => summarizeInventory('', []));
});
