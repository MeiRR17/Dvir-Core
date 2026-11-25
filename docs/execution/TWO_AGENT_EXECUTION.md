# Two-agent execution and integration gate — 2026-11-25

Coordination authority: [Issue #14](https://github.com/MeiRR17/Dvir-Core/issues/14). Read it and this file before each development cycle. This plan coordinates the existing master plan; it does not waive any acceptance or owner approval gate.

## Effective now
Freeze overlapping feature work. Two workstreams only. Agent identity is determined by the existing PR/branch, not a guessed chat name. Before any edit, post an ACK in #14: role, exact HEAD SHA, current task, intended files, blocked gates. Read the other agent's latest ACK and PR comments. Do not duplicate its work or start a new PR for every increment. If role is ambiguous, inspect the current branch; if still ambiguous do read-only review and report. Never claim a chat has received or acted on a message until its ACK is visible.

| Role | Existing branch / PR | Responsibility |
|---|---|---|
| A — integration lead | feat/m00-inventory-0.0.1 / #4 | sole writer of consolidation candidate, inventory, authorization, receipt policy, shared storage reconciliation, full regression, M00 decision |
| B — local runtime | feat/m00-review-pipeline-0.0.10 / #13 | runtime-only work: src/runtime, runtime fixtures and separate runtime handoff; review Ollama/MLX discovery and benchmark contracts, authorized host qualification; no shared storage or inventory edits during integration |

Agent B stops independent feature increments until A captures its exact input SHA; then B can prepare runtime-only tests or read-only qualification notes, coordinating any changed input SHA through #14. Agent A owns shared STATUS, CHANGELOG and decisions on the integration candidate; B records its results in PR #13 comments or a runtime-specific handoff file. Neither agent changes the other's branch. Read current HEAD before writing; use compare-and-swap expected SHA or equivalent fast-forward safety, never force-push.

## Execution queue
1. A: snapshot exact current heads of #4 and #13, their merge base, file diffs, and #3/#5–#12 unique changes. Create exactly one candidate branch named integration/m00-consolidated-20261125 from current #4 SHA after confirming it is not already present. Keep input branches and PRs intact. Open at most one draft integration PR targeting #4, or reuse it if already created. Do not merge to main.
2. A: produce a file-level reconciliation matrix (retain, replace, adapt, superseded with rationale). Preserve #4's prepared audit/authority and evidence binding, #13's runtime modules and authenticated-store publication outcomes and fault tests. Review compatibility of receipt envelopes, HMAC domains, owner scopes, retention, strict vs explicitly authorized partial review, cancellation, connector error typing and imported tests. Prefer one underlying implementation per capability; no blind cherry-pick or overwrite. Reconcile conflicting docs and version history. Review old PRs before proposing closure; do not close or delete without owner decision.
3. A: make candidate reproducibly testable. Pin Node/TypeScript/dev dependencies as needed, provide a single documented full-test and strict-typecheck command, run every inventory/runtime/storage test file against the same tree. Record exact tested SHA, environment, commands, exit codes, failures and counts; distinguish node test entries from internal assertions. If execution unavailable, record NOT_RUN, never fabricate PASS. Fix concrete regressions only. B reviews runtime contracts, fixtures and no-cloud/no-generation defaults.
4. B: verify current Ollama/MLX metadata discovery and benchmark readiness on fixtures; prepare read-only Core-host validation instructions and workload plan. Existing terminal connector must explicitly advertise Core scope before any Core-host command. No cross-project traversal, installation, permission expansion, model download, paid API, network exposure or inference without the applicable approval. If blocked, report OWNER_BLOCKED and continue fixture-only work that does not conflict with A. No invented measurements.
5. A: complete actual personal-repo decision/source audit read-only under approved scope, with unknowns and coverage. No organizational data. Obtain explicit approval for private evidence retention location, authority binding, key provisioning, rotation and deletion policy; no real private data in public GitHub. Reconcile published_unconfirmed as visibility only, never automatic overwrite. B: approved Core-host read-only probes, then approved bounded inference benchmarking. Record only redacted aggregate evidence publicly.
6. A: publish a single M00 readiness matrix and candidate SHA; obtain owner approval before any merge/deploy. M00 remains incomplete if actual audit, authority, approved retention, Core mapping or model qualification are open. Do not confuse fixture PASS with integrated/production ready. Once M00 acceptance is satisfied and owner approves, propose merging the stacked foundation, plan and reconciled candidate in dependency order. Do not silently bypass gates.
7. M01 (v0.1.0) only after M00 gate: A owns typed Core Registry contracts, migrations, read API; B supplies validated ModelSpec/Capability/Benchmark requirements and adapter tests, no independent registry. Then M02 Fleet, M03 MCP Gateway, M04 local routing, M05 durable agents/jobs, M06+ per master plan. A maintains one integrated release/version history.

## Per-cycle handoff
Comment on #14: role / input SHA / files / actual results / output SHA / unresolved risk / next task. A updates candidate STATUS, DECISIONS, EVIDENCE, TOOL_INVENTORY, MODEL_BENCHMARK and CHANGELOG as applicable. A records B's accepted input SHA. Before starting next task read #14 and current candidate status. If another agent is writing the same area, stop editing it, work on nonoverlapping tests/review, and report. No unnecessary new abstractions, version bumps or PRs just for activity. Use exact source evidence; public repository gets synthetic fixtures and redacted summaries only.

## Acceptance checklist
- [ ] Both agent ACKs, fixed input SHAs, one candidate and file-level reconciliation.
- [ ] All unique useful changes reviewed; no duplicate shared implementations.
- [ ] Full regression/typecheck reproducible at exact candidate SHA.
- [ ] Actual personal repo audit and authority/retention approved.
- [ ] Core scope explicitly authorized, runtime probes and approved real benchmarks completed.
- [ ] Remaining security/durability limitations documented.
- [ ] Owner reviews release/migration/rollback plan; merge/deploy only with explicit authorization.
