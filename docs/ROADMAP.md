# Dvir Core — Proposed roadmap
Not yet approved; align with Dvir OS roadmap and canonical plans. Each milestone requires acceptance evidence.

## v0.1 Inventory foundation (first)
- Define typed asset/observation/dependency contracts and versioned read-only API.
- Create sample macOS collector with explicit opt-in and no privileged changes.
- Add idempotent ingestion, timestamps, source provenance, stale-state semantics.
- Demonstrate software/service location and dependency lookup with fixture data.

## v0.2 Fleet and observability
- macOS host metrics, optional Windows/WSL adapter, heartbeat, offline recovery.
- Service health history and minimal dashboard; audit and access controls.

## v0.3 AI runtime
- Inspect actual Hermes installation and MLX compatibility.
- Benchmark 80B 4-bit memory including KV cache and system overhead.
- Add explicit model registry, scheduler, streaming and fallback; no assumed always-resident trio.

## v0.4 Agent orchestration
- Permissioned Hermes adapter; optional OpenCode worker.
- Durable job queue, isolation, checkpoints, review evidence and approvals.

## v0.5 Development integration
- GitHub inventory and roadmap references, PR lifecycle, isolated worktrees.
- Human approval for merges; no unauthorized publication.

## v0.6 Storage and knowledge
- Local corpus inventory/read-only lexical index; measure before embeddings.
- Backup inventory, restore checks; optional NAS evaluation based on measured needs.

## v0.7 Unified admin
- Responsive RTL-capable operations console with inventory, jobs, routing, alerts and evidence.

## v1.0 Operational readiness
- Recovery drills, least-privilege review, observability, access boundaries and deployment documentation.

## Coordination with Dvir OS
Do not block Dvir OS's existing priority vertical slices (day/week, capture/inbox, agent evidence review, Drive/GitHub sync). Expose only stable APIs; keep product UX and infrastructure separate.
