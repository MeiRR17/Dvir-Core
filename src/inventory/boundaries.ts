// Architectural routing only: never grants runtime permission or asserts deployment.
const boundaries = {
  product: { owner: 'dvir-os', milestone: 'M09', access: 'contract' },
  project_status: { owner: 'apex-pci', milestone: 'M06', access: 'read' },
  corpus_catalog: { owner: 'corpora', milestone: 'M07', access: 'read' },
  graph_evidence: { owner: 'neo4j', milestone: 'M07', access: 'read' },
  development_workflow: { owner: 'autopilot', milestone: 'M05', access: 'read' },
  terminal_execution: { owner: 'existing-terminal-mcp', milestone: 'M03', access: 'approval' },
  agent_runtime: { owner: 'hermes', milestone: 'M04', access: 'evaluate' },
  model_routing: { owner: 'core', milestone: 'M04', access: 'internal' },
} as const;
export type Capability = keyof typeof boundaries;
export const capabilities: readonly Capability[] = Object.freeze(Object.keys(boundaries) as Capability[]);
export type Boundary = (typeof boundaries)[Capability];
export function resolveBoundary(capability: unknown): Boundary | undefined {
  if (typeof capability !== 'string' || !Object.prototype.hasOwnProperty.call(boundaries, capability)) return undefined;
  return { ...boundaries[capability as Capability] };
}
export function checkOwnership(capability: unknown, owner: unknown): 'declared_owner' | 'unknown_capability' | 'owner_mismatch' {
  const boundary = resolveBoundary(capability);
  if (!boundary) return 'unknown_capability';
  return owner === boundary.owner ? 'declared_owner' : 'owner_mismatch';
}
