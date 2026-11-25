# Execution status — 0.0.18 (2026-11-25)
Base: reviewed master-plan commit b0e52cf76f688de52eb1c9a9d21786c12bcb7c0e; stacked on draft plan PR #2, not main. Foundation PR #1 also pending.

| Work package | State | Acceptance |
|---|---|---|
| M00.1 pagination/owner coverage validator | IMPLEMENTED / FIXTURE_PASS | strict typecheck, nine synthetic assertions, remote blobs verified |
| M00.2 personal repository enumeration | LOCAL_VERIFIED (connector only) | owner-filtered page requests and empty terminal page observed; no org access; raw results not published |
| M00.2a bounded injected page reader | IMPLEMENTED / FIXTURE_PASS | 13 synthetic cases; typecheck and remote blob comparison |
| M00.2b per-page deadline and failure classification | IMPLEMENTED / FIXTURE_PASS | 14 new checks, strict typecheck and matching remote blobs |
| M00.3 existing terminal reachability | LOCAL_VERIFIED (approved project only) | bounded read-only diagnostics returned exit 0 |
| M00.4 Core terminal mapping | OWNER_BLOCKED | connector project enum does not include Core; no bypass attempted |
| M00.5 linked plan/ADR and dependency audit | IMPLEMENTED / FIXTURE_PASS (ownership boundaries); full audit pending | complete relevant refs, ADRs, branch/manifest checks and overlap review |
| M00.5a per-repository decision coverage | IMPLEMENTED / FIXTURE_PASS | 15 synthetic checks; archive counts, stable ID, scope denial, evidence handles, unknown coverage |
| M00.5b review and private receipt reader contract | IMPLEMENTED / FIXTURE_PASS | 19 checks; page scope, receipt binding, freshness, unresolved decisions |
| M00.5c authenticated private receipt file store | IMPLEMENTED / FIXTURE_PASS | 18 checks; reopen, tamper, expiry, owner, filesystem denial |
| M00.5d receipt hardening | IMPLEMENTED / FIXTURE_PASS | 13 new checks, 18 previous checks rerun; runtime schema, hard read bound, duplicate retry denial |
| M00.5e stored-receipt review integration | IMPLEMENTED / FIXTURE_PASS | 8 integration tests and 31 existing storage checks; aggregate-only output |
| M00.5f receipt write recovery classification | IMPLEMENTED / FIXTURE_PASS | six recovery tests, injected file/directory fsync failures, 39 regression checks |
| M00.5g bounded collected review pipeline | IMPLEMENTED / FIXTURE_PASS | 10 new tests; all 12 fixture files and strict typecheck pass |
| M00.5h GitHub connector shape adapter | IMPLEMENTED / FIXTURE_PASS + LIVE_SCHEMA_OBSERVED | owner-filtered live envelope, ID, archive and visibility observations; 10 new tests, 13-file regression |
| M00.5i scoped receipt preparation and retention policy | IMPLEMENTED / FIXTURE_PASS | 17 targeted tests; proposed policy, not approved retention |
| M00.5j private evidence binding and bounded intake | IMPLEMENTED / FIXTURE_PASS | 17 targeted tests, exact source/digest/approval binding, batch limits, stored receipt integration |
| M00.5k atomic prepared receipt persistence | IMPLEMENTED / FIXTURE_PASS | five new tests, HMAC-protected binding, reopen and revocation fixture |
| M00.5l prepared audit entry point | IMPLEMENTED / FIXTURE_PASS | 9 new tests, 91 Node test entries across 17 local test files; explicit trusted authority contract |
| M00.6 runtime module integration | IMPLEMENTED / NOT_RUN | 14 runtime source/test files integrated from B's exact input; resolver, execution fingerprint and write-once recovery hardened; integrated tests/typecheck not run |
| M00.6 host qualification | OWNER_BLOCKED | Core terminal mapping absent; no live Ollama/MLX probe, model load or inference |
| M01–M12 | PLANNED | dependency gates in master plan |

## 0.0.18 — runtime integration candidate

| Work package | State | Acceptance |
|---|---|---|
| M00.5m shared authenticated storage integration | IMPLEMENTED / FIXTURE_PASS | v1 receipt envelope and HMAC domain preserved; prepared binding retained; fault outcomes tested |
| M00.5n PR #3/#5–#12 reconciliation | IMPLEMENTED / REVIEW_PENDING | file-level decisions in RECONCILIATION.md; no duplicate reducer/wrapper imported |
| M00.5o owner and cancellation hardening | IMPLEMENTED / FIXTURE_PASS | case-insensitive requested-owner login only; typed denied; late connector response discarded |
| M00.5p targeted candidate validation | FIXTURE_PASS | 39 Node test entries and strict typecheck of 21 files in isolated Linux fixture; not full regression |
| M00.5q personal repository screening | PARTIAL / SCREENING | 83/83 personal-owner records enumerated; 69 README files available, 14 empty/missing; selected domain boundaries documented; full branch/manifest audit pending |
| M00.5r pinned candidate CI | IMPLEMENTED / RUN_PENDING | Workflow pins Node 22.18.0, TypeScript 5.9.3 and @types/node 22.20.5; now includes inventory/runtime/storage suites; no run result observed |
| M00.6a PR #13 runtime integration | IMPLEMENTED / REVIEW_PENDING | 14 runtime source/test files integrated from B SHA; A hardened three trust/recovery contracts; tests not run |
| M00.6b runtime acceptance | PARTIAL / NOT_RUN | MLX static symlink-root/ancestor denial and owner resolver; Ollama trusted port resolver; execution fingerprint; benchmark write-once recovery; TOCTOU and actual host qualification remain open |
| M00.4 Core terminal mapping | OWNER_BLOCKED | terminal connector still advertises Music and DvirStudio only |

Next exact task: obtain Agent B's read-only review of the integrated runtime files; run the pinned full inventory/runtime/storage tests and strict typecheck on the same candidate SHA; fix concrete failures; resolve the MLX descriptor-relative path race before any host probe. Core terminal mapping, private retention/key approval, complete repository audit and actual runtime qualification remain blockers. M00 remains incomplete; M01 gated. No merge, deployment or release. 
Current integration pointer: draft PR #15, based on PR #4 head d729710f8eb59d70aea978cfab3d8c594ec9acfc. Prior tested source snapshot af5eafddf7accf069dd4993ec9502b265fec8160 covers the earlier inventory/storage fixture only. Runtime integration source snapshot b0851df05ba37f3ecf32f5b1f071fcedbf1115a9 includes the 14 runtime files, MLX root guard and receipt publication-outcome correction; runtime tests and strict typecheck on this tree are NOT_RUN. PR metadata is authoritative for the current candidate HEAD and commit count. Draft only; no merge.

Receipt publication outcome correction is included in the latest source snapshot: durable-after-cleanup-error is not downgraded to generic observed readback. Two focused tests added; NOT_RUN. No CI pass claimed.
