# Dvir Core — Architecture proposal
Status: proposed. Align with Dvir OS AGENTS.md, docs/architecture/overview.md, latest ADRs and canonical Drive plans before implementation.

## Logical topology
```text
Dvir OS (Ma'ir / Zion)  --->  Dvir Core API + policy/approval boundary
                                      |
                           Inventory + dependency registry
                            /          |           \
                     Collectors   Job scheduler   Integrations
                     (read-only)   (checkpointed)  (scoped)
                        |              |              |
                 Hosts/services    Hermes/OpenCode   GitHub/Drive
                        |              |
                  Local storage    MLX/model runtime
```

## Deployment
- Primary node: MacBook Pro M1 Max 64 GB. No assumption of continuous availability.
- Optional workers: MacBook Air M4, Windows/WSL after opt-in.
- Optional NAS is a storage target, not a prerequisite.
- Start as a modular monolith with versioned adapters and a single metadata store; avoid premature microservices.
- Backend contracts should align with Dvir OS TypeScript-first decisions; Python only for justified processing adapters.

## Core entities
Asset(id,kind,display_name,owner,logical_location,source,last_observed_at,observed_state);
Host(asset_id,os,architecture,cpu,gpu,memory);
SoftwareInstallation(asset_id,host_id,name,version,source);
Service(asset_id,host_id,endpoint,port,health,last_checked_at);
Model(asset_id,provider,format,quantization,estimated_memory,measured_memory);
Agent(asset_id,runtime,permissions,capabilities);
Repository(asset_id,remote,default_branch,last_synced_at);
Volume(asset_id,host_id,capacity,free_bytes,backup_policy);
Dependency(from_id,to_id,kind);
Observation(asset_id,collector,observed_at,expires_at,payload_hash);
Job(id,kind,owner,state,checkpoint,approval_state,evidence_refs).

## Interfaces
- Collector -> ingestion: authenticated, versioned, idempotent, bounded payloads.
- Dvir OS -> Dvir Core: inventory query, job status, evidence links and approval requests.
- Worker -> scheduler: lease/heartbeat, checkpoint and completion evidence.
- Provider adapters -> runtime: explicit capability negotiation; no assumption every provider supports tools or streaming.

## Security and reliability
No arbitrary shell execution from discovery. Least privilege, explicit approval for execution and side effects, audit log, encrypted secret storage, private network access. Stale heartbeat is not healthy. Retry idempotent operations, avoid duplicate commits, maintain durable checkpoints. Benchmark memory pressure before enabling multiple resident LLMs.

## Sources of truth
GitHub: code and development history. Google Drive: canonical planning docs. Local disk: research corpus. Calendar: recorded event times. Dvir Core: operational observations and provenance, not copies of entire source systems.
