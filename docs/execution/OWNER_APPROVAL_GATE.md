# M00 owner-approval gate

Status: OPEN. This register is not an authorization; no action is approved by its existence.

## Existing private terminal MCP

Observed:
- Connected project enum exposes only `Music` and `DvirStudio`.
- Read-only `git_status` in DvirStudio returned "not a git repository".
- Bounded inspection of the approved DvirStudio root found no Dvir-Core worktree/repository marker.
- No Core command, Core filesystem access, write, process action or alternate path was attempted.

Owner action:
- Add an explicit `Dvir-Core` project mapping through the existing MCP's approved configuration mechanism, or provide another explicitly approved project-scoped mapping.
- Confirm exact allowed root and command identity.
- Read-only diagnostics and execution/write permissions must remain separate.
- Do not repoint Music/DvirStudio or use arbitrary `cwd` to bypass the allowlist.

## Private evidence and receipts

No private repository inventory, host inventory, raw logs, credentials or private evidence may be written to this public repository.

Before persisting any real receipt, owner approval is required for:
- Local storage location and owner identity.
- Encryption-at-rest and key source (OS keychain or other approved secret store); never commit or print keys.
- Receipt authority binding and revocation.
- Retention period, deletion policy and backup/restore policy.
- Key rotation and recovery procedure.
- Whether any redacted aggregate may be published (default: no).

Until approval, use synthetic fixtures only.

## Host qualification

After Core mapping is approved, a separate read-only host-probe approval is required. Proposed scope: OS/architecture and runtime versions; owner-selected MLX environment handle and descriptor-anchored site-packages metadata; local Ollama presence through owner configuration and bounded GET metadata routes; sanitized exit status and aggregate state only.

Excluded: model import/download/load, inference, benchmark, service restart, package installation, environment mutation, credential reads and network exposure.

MLX remains blocked until descriptor-relative traversal is implemented and tested on Linux and the supported macOS/APFS host. Static symlink checks are insufficient.

## Actual inference and benchmark

Actual model execution requires separate explicit approval identifying exact model/revision/quantization and rights, workload/data classification, resource ceiling/duration/cancellation, local receipt write permission, zero-cost/local-only or spend ceiling, and allowed redacted outputs. No actual benchmark is claimed or authorized by fixture tests.

## Current gates

| Gate | State | Evidence / next action |
|---|---|---|
| Personal repo enumeration | PARTIAL_PASS | 83/83; README gaps classified; broader source/manifest/PR audit partial |
| Candidate fixtures + strict typecheck | PASS | CI #123, SHA `b81bc994a0d84dd758a2af916b221083fc6c28a3`; 176/176 across partitions, zero TS diagnostics |
| Agent B runtime review | PENDING | Await B ACK and read-only trust-boundary review |
| Core terminal mapping | OWNER_BLOCKED | Core project scope absent from connector |
| Private retention/key policy | OWNER_DECISION_REQUIRED | No approval recorded |
| MLX descriptor-relative boundary | NOT_IMPLEMENTED | B implementation + Linux/macOS/APFS tests required |
| Live host qualification | NOT_RUN | Requires Core mapping, MLX security gate and read-only approval |
| Actual inference/benchmark | NOT_AUTHORIZED | Requires separate explicit approval |

M00 remains incomplete. M01 must not start early. No merge, deployment, permission expansion, model load or inference is authorized by this register.
