# M00 branch reconciliation — 2026-11-25

Status: single candidate created; selected inventory/storage adaptations are fixture-tested. Runtime module integration and full regression remain pending. No source branch or legacy PR was merged, closed or deleted.

## Fixed inputs and candidate

| Item | Ref | Exact SHA / state |
|---|---|---|
| Agent A input | PR #4 / feat/m00-inventory-0.0.1 | d729710f8eb59d70aea978cfab3d8c594ec9acfc |
| Agent B input | PR #13 / feat/m00-review-pipeline-0.0.10 | 1ed646b3cf9d80a9c2dd2e92689829ebd6d628c1 |
| Merge base | A/B comparison | 2af0d0b1350d57138f4c49ba1772da170bca30a1 |
| Candidate | integration/m00-consolidated-20261125 | created from exact Agent A SHA; final draft PR #15; 20 commits ahead, 0 behind at tested source snapshot af5eafddf7accf069dd4993ec9502b265fec8160. Subsequent commits are documentation-only. |
| PRs | #4 and #13 | preserved, no merge or source edits |

A/B comparison was diverged (A 46 commits ahead of merge base; B 26 commits ahead; 36 changed paths). The candidate is based on A, not a synthetic merge of divergent histories.

## PR #3 and #5–#12 review

| PR | Unique contribution reviewed | Candidate decision |
|---|---|---|
| #3 | Early name-based inventory reducer and tests | **Superseded.** A's stable numeric repository IDs, explicit offsets, visibility projection, strict duplicate rejection and empty-page completion are the current contract. Do not add a second reducer. |
| #5 | Standalone pagination reader | **Superseded.** A's collector adds per-page AbortSignal/deadline, sanitized failures and explicit incomplete coverage. |
| #6 | Initial deadline/error classification | **Superseded/adapted.** Retain A's per-page deadline implementation; add typed denied to the failure union and regression coverage. |
| #7 | Reconciliation cases, case-insensitive owner comparison and denied status | **Adapted.** Normalize case only when the observed login equals the requested personal owner case-insensitively; foreign owners still fail closed. Preserve denied distinctly. |
| #8 | Decision summary with archive-unknown aggregate | **Not copied as a second API.** Keep A's four-argument reducer, explicit enumeration-complete input and receipt-handle validation. Connector contract requires a boolean archive observation; missing archive remains invalid rather than silently counted. |
| #9 | Evidence gate wrapper | **Superseded.** A's review, receipt-binding and prepared-audit path validates the full review input before private lookup and binds current approval/source/evidence. No duplicate gate wrapper. |
| #10 | Basic authenticated receipt store | **Superseded by A's prepared receipt contract.** Preserve A's privateBinding, canonical binding handle and legacy read projection. |
| #11 | Stored-review adapter | **Superseded.** Keep A's stored review and prepared-audit entry points; do not add a second review wrapper. |
| #12 | GitHub reader adapter | **Superseded/adapted.** Keep A's stricter result.repositories, User-owner, explicit archive and metadata projection. Add a post-await AbortSignal check so late connector responses are discarded. |

## PR #13 selected storage integration

- Adopt src/storage/authenticated-json-file-store.ts as the single shared primitive for authenticated JSON records.
- Retain the existing receipt v1 envelope and HMAC domain dvir-core:receipt:v1\\0; existing receipt blobs remain readable. No migration or rewrite of existing records.
- Keep putPrepared/readPrepared and the private binding in the same authenticated publication. Legacy read strips the private binding; legacy records do not resolve through readPrepared.
- Preserve the three publication states not_published, published_unconfirmed, and durable. A matching read after a directory-fsync error is reported as published_unconfirmed, not durable. No automatic retry, overwrite or deletion.
- Add prepared-receipt recovery that compares both the public receipt and every private-binding field before classifying an observed write.
- Import the storage round-trip, tamper, symlink, hard-bound read and child-process fsync/crash tests. Add canonical-path pinning tests. Static canonical path checks do not claim race-free openat semantics.
- PR #13 runtime modules are not yet integrated into this candidate; Agent B owns their review and runtime-only handoff. No Ollama/MLX host probe or inference is claimed.

## Candidate changes in this cycle

- Shared storage primitive and round-trip/path/fault fixtures.
- Prepared receipt store composed over the shared primitive without changing the receipt v1 HMAC contract.
- Prepared receipt recovery and explicit ambiguous-publication status.
- Inventory owner-case normalization and typed permission-denial classification.
- Connector late-response cancellation check.
- Targeted fixture run: 39 Node test entries passed; strict TypeScript check passed for 21 source/test files in an isolated Linux fixture. This is not the complete inventory/runtime/storage regression.
