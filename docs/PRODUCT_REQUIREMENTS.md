# Dvir Core — Product Requirements (proposal v0.1)
Status: proposed, not approved. Date: 2026-11-23.

## Mission and boundaries
Dvir Core is the local-first infrastructure control plane supporting Dvir OS. It provides an evidence-backed inventory of devices, installed software, services, runtimes, models, agents, repositories, storage, health, and dependencies. Dvir OS owns personal goals, day/week UX (Ma'ir), and long-horizon UX (Zion). Dvir Core is not a third product tab.

## Functional domains
1. **Core Registry:** stable IDs, asset type, owner, logical location, capabilities, observed_at, provenance, status, relationships and history.
2. **Fleet:** opt-in read-only collectors for macOS, Windows/WSL and later mobile; OS, CPU/GPU, RAM, disks, installed apps and versions; offline/unknown state.
3. **Services:** processes, endpoints, ports, versions, service dependencies, start mode, health observations; never equate stale observations with live health.
4. **AI runtime:** local MLX and compatible endpoints, quantization, context and memory budgets, model loading/unloading, measured latency and resource pressure; cloud only when explicitly authorized.
5. **Agents:** Hermes first as a candidate (verify installation/version/permissions), OpenCode as optional development adapter; per-agent capability manifests, sandbox, audit, checkpoints and approval.
6. **Development:** GitHub repositories, branches, roadmap references, issues, PRs, worktrees, task assignment, evidence and review; no automatic merge.
7. **Storage:** local disks, optional NAS, research corpus locations, capacity, retention, backup policy and restore verification; read-only incremental indexing of 400–500 GB local corpus.
8. **Knowledge:** source-indexed search, ADRs, agent outcomes and citations; lexical retrieval first, embeddings only after benchmark.
9. **Workflows:** durable queues, priority lanes (Human/AI/Background), idempotency, retries, checkpoints, cancellation, concurrency limits; one heavy local job initially.
10. **Network:** private access, service discovery, connectivity and VPN options; no public ports by default.
11. **Security:** least privilege, scoped secrets, authentication, audit log, approval gates, encrypted backups, sensitive-data boundaries.
12. **Observability:** CPU/GPU/RAM/storage, job lifecycle, logs, traces, health and alert thresholds; distinguish observed vs inferred.
13. **Integrations:** GitHub source code, Google Drive canonical planning docs, Calendar for recorded events; permission-scoped, explicit opt-in.
14. **Backup and recovery:** versioned backups, restore drills, outage/sleep recovery and data integrity checks.
15. **Control UI:** responsive RTL-compatible admin interface, asset inventory, topology, task state, model routing, evidence and approvals; not a replacement for Dvir OS frontend.

## Non-functional requirements
- Local-first, offline-tolerant, minimal operational overhead; modular monolith initially.
- No mandatory NAS, UPS, always-on server or additional paid AI APIs.
- Support MacBook Pro M1 Max 64 GB as primary local host; MacBook Air M4 and Windows/WSL as potential nodes after consent.
- No hard-coded performance claims (e.g. 150ms classification, 35 tokens/s, zero swap); benchmark actual workload and KV-cache overhead.
- Sensitive local corpus never bulk-uploaded to GitHub/Drive; exclude military/organizational materials and third-party dossiers.
- Read-only discovery default; actions with external effects or irreversible changes require explicit authorization.
- Source-of-truth separation and provenance for every imported observation.
- Versioned API contracts, migration strategy and accessible UI.

## Initial acceptance criteria (v0.1)
- A typed schema can represent host, software, service, model, agent, repository, volume and dependency.
- Read-only sample collector imports inventory with timestamps and provenance; repeat imports do not duplicate assets.
- UI/API can answer: where is a service installed, when last seen, what depends on it, and what is unknown.
- Permissions distinguish read-only inventory from execution; no unapproved commands or network exposure.
- All claimed health states expire into stale/unknown when heartbeats stop.

## Explicitly deferred
Always-on distributed scheduling, autonomous deployment/merge, NAS purchase, public access, paid model routing, bulk embeddings, production secrets management integration until requirements and tests justify them.

## Open decisions
Collector deployment/consent model; database choice and retention; canonical registry ID scheme; API authentication; hardware benchmarking; integration ownership and migration with Dvir OS; final module names.
