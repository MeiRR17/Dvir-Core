# Dvir Core agent instructions

Effective coordination update: 2026-11-25. Before any development, read [Issue #14](https://github.com/MeiRR17/Dvir-Core/issues/14), its newest comments, and [docs/execution/TWO_AGENT_EXECUTION.md](docs/execution/TWO_AGENT_EXECUTION.md). Read the master plan and execution STATUS. The two-agent coordination plan controls sequencing and ownership; the master plan's security/approval gates remain in force.

- PR #4 / feat/m00-inventory-0.0.1: Agent A, integration lead. Own the single consolidation candidate and shared infrastructure.
- PR #13 / feat/m00-review-pipeline-0.0.10: Agent B, runtime qualification. No inventory/shared-storage modifications during consolidation.
- ACK role, exact HEAD, intended task/files and blockers in #14 before editing. No overlapping development or fresh version-only PRs. If branch identity is unclear, read-only review first.
- Re-read latest HEAD and use safe fast-forward updates. Preserve existing work and history; no force push or branch deletion.
- Run and report actual tests, exact SHA and limits. Never report live integration or benchmark based on fixtures.
- Public repo: no private inventory, host data or secrets. Do not bypass terminal scope or owner authorization. No merge, deployment, permission expansion or inference without applicable explicit approval.
- Commit meaningful work and post a handoff in #14 every cycle. Follow the concrete queue in the coordination plan rather than independently choosing another receipt abstraction.
