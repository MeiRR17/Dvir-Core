# Dependency boundary review — 0.0.4
Scope: source review, not deployment or integration certification. The [master plan](../AI_MCP_MASTER_PLAN_2026_11_25.md) defines the candidate dependencies. Private source refs, paths containing private data, and detailed local machine inventory are not exported to this public repo.

| Logical capability | Existing owner | Core decision | Next acceptance |
|---|---|---|---|
| Product UX | Dvir OS | contract only, M09 | authenticated contract; no new product perspective |
| Project status/evidence | Apex/PCI | read existing semantics, M06 | exact-SHA, stale/unknown, authorization and parity tests; no second completion engine |
| Corpus catalog | Corpora | rights-aware read adapter, M07 | approved sample, source resolution, rights checks; no duplicate index or raw upload |
| Graph evidence | Neo4j | bounded signed reads, M07 | verify version, provenance, approval, denial and no writes |
| Development workflow | Autopilot | read status first, M05 | safe manifest and receipts; no browser automation dependency |
| Terminal execution | existing private MCP | reuse, M03 | explicit Core scope and bounded session receipts; approval for execution |
| Agent runtime | Hermes | evaluate, M04 | installation, version, capabilities, real local test |
| Model routing | Core | internal, M04 | local model capability/latency evaluation; no assumed cloud fallback |

Source review performed: Dvir OS ADR index, both ADR 0011 entries, ADR 0012–0014 excerpts, agent guidance and package manifest; Apex README; Corpora README and access policy; Neo4j README and signed bridge contract; Autopilot and Tab Autopilot README and package manifests. Not all files or implementations have been audited. Source status and owner-approved deployments are distinct. Neo4j [bridge contract at reviewed public SHA](https://github.com/MeiRR17/Neo4j/blob/fd9ab94452016c1b877bbdfe1f99f907e3df895c/docs/integrations/RESEARCH-BRIDGE-v1.json) declares required source trail, human review, no writes and no full text. Do not infer availability. Tab automation remains optional and no bypass is authorized.

Implementation: `src/inventory/boundaries.ts` records only logical ownership; `checkOwnership` rejects unknown capabilities and owner mismatches. It is not authentication, an access grant, or a live integration. Remaining M00 gaps: per-repository decision inventory, private-source evidence retention, runtime/model inventory and Core-specific terminal scope.
