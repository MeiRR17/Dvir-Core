# Execution status — 0.0.17 (2026-11-25)
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
| M00.6 actual model/runtime inventory | PLANNED (partial probe) | approved runtime metadata and benchmark; no inference benchmark yet |
| M01–M12 | PLANNED | dependency gates in master plan |

## 0.0.17 — consolidation candidate

| Work package | State | Acceptance |
|---|---|---|
| M00.5m shared authenticated storage integration | IMPLEMENTED / FIXTURE_PASS | v1 receipt envelope and HMAC domain preserved; prepared binding retained; fault outcomes tested |
| M00.5n PR #3/#5–#12 reconciliation | IMPLEMENTED / REVIEW_PENDING | file-level decisions in RECONCILIATION.md; no duplicate reducer/wrapper imported |
| M00.5o owner and cancellation hardening | IMPLEMENTED / FIXTURE_PASS | case-insensitive requested-owner login only; typed denied; late connector response discarded |
| M00.5p targeted candidate validation | FIXTURE_PASS | 39 Node test entries and strict typecheck of 21 files in isolated Linux fixture; not full regression |
| M00.6 PR #13 runtime integration | PLANNED / AGENT B REVIEW | Ollama/MLX and benchmark modules not yet integrated or qualified |
| M00.4 Core terminal mapping | OWNER_BLOCKED | terminal connector still advertises Music and DvirStudio only |

Next exact task: Agent B reviews the candidate's runtime integration contracts and returns a runtime-only handoff without modifying inventory/shared storage. Agent A then reconciles runtime modules and runs the complete inventory/runtime/storage suite on one candidate tree. M00 remains incomplete; M01 gated. No merge, deployment or release. 
Current integration pointer: draft PR #15 head 4ac5ab28995b09a20bcb148e36cc722cb5150ab5, based on PR #4 head d729710f8eb59d70aea978cfab3d8c594ec9acfc. Tested source snapshot: af5eafddf7accf069dd4993ec9502b265fec8160; subsequent commits are documentation-only. Final candidate comparison: 26 commits ahead, 0 behind. Draft only; no merge.
