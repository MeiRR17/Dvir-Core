## 0.0.18 — 2026-11-25 (unreleased; runtime integration candidate)
- First pinned integrated CI execution (Node 22.18.0): 158/160 test entries passed; MLX and Ollama runtime test modules failed to parse due to extra closing parentheses. Typecheck was skipped; Agent B owns the runtime fix. Updated CI to run typecheck independently after test failure when tool installation succeeds; runs #90 and #95 confirm it reports the same two TS1005 parse errors. No merge.
- Completed cursor pagination of personal-owner branches for dvir-os (310), Corpora (452) and Israel Evidence Atlas (314); PR search remains capped and source/manifest audit remains partial.
- Integrated the 14 runtime source/test files from Agent B's exact PR #13 input SHA into the sole M00 candidate; PR #13 and its branch remain unchanged.
- Replaced arbitrary MLX filesystem paths with opaque owner-configured environment handles; added static symlink-root and symlink-ancestor denial. Added a descriptor-anchored implementation/acceptance design; descriptor-relative/openat race protection remains unimplemented and host use is blocked.
- Replaced caller-supplied Ollama ports with an owner-configured endpoint resolver; retained fixed-loopback, GET-only, bounded metadata requests and sanitized resolver failures.
- Bound benchmark receipts to a private execution fingerprint (model digest, quantization, context size, KV-cache digest, runtime version and host digest); added exact write-once readback recovery for ambiguous publication.
- Legacy benchmark receipts without execution identity now fail closed; no automatic migration, retry, overwrite or deletion.
- Preserved durable publication state when cleanup fails after fsync; added separate durable-cleanup-warning outcome and exact-readback tests.
- Added a minimal private ESM package manifest with Node >=22.18.0 and a single `npm test` command; CI invokes that command and retains pinned strict typecheck. Added a future pull_request trigger for PR #15's base; it remains inactive until the workflow file is present on that base branch. Integrated runtime tests and strict typecheck are NOT_RUN; no CI result observed.
- No Core-host probe, model load, inference or benchmark. M00 remains incomplete; no merge or release.

## 0.0.17 — 2026-11-25 (unreleased; M00 consolidation candidate)
- Created the single integration candidate from PR #4's exact reviewed HEAD; opened draft integration PR #15; preserved PR #4, PR #13 and all earlier draft PRs.
- Reconciled PR #3 and #5–#12: retained A's prepared-audit contracts; adapted denied classification, case-insensitive owner normalization and late connector cancellation; superseded duplicate reducers/wrappers.
- Integrated PR #13's authenticated JSON storage primitive while preserving the existing receipt v1 envelope/HMAC domain and A's private prepared binding.
- Added prepared-receipt write recovery that distinguishes published_unconfirmed from durable publication and never retries or overwrites automatically.
- Isolated Linux fixture run: 39 Node test entries passed; strict TypeScript 5.8.3 check passed for 21 source/test files; changed and critical dependency blob hashes matched GitHub.
- Initial personal-repository screening is now recorded; full per-repository source/manifest/branch audit remains open. Added a pinned candidate workflow for Node 22.18.0 and TypeScript 5.9.3; its run is pending. Full inventory/runtime/storage regression, runtime PR #13 integration, macOS/APFS durability, Core terminal mapping, private retention approval and model qualification remain open.

# Changelog
## 0.0.16 — 2026-11-25 (unreleased)
- Prepared audit entry point composes connector, authenticated file receipts and explicit trusted current-context authority contract.
- Nine new tests; 91 passing Node test entries across 17 local fixture files, including connector; strict typecheck of 31 files.
- Actual live audit/authority, private retention and Core terminal mapping remain pending.

## 0.0.15 — 2026-11-25 (unreleased)
- Atomic prepared receipt and private binding persistence in existing HMAC store, with canonical handle verification and legacy compatibility.
- Five new tests; 72 passing Node test entries in 15 local fixture files (connector suite excluded), strict typecheck and approved-host integrity primitive probe.
- Authenticated live lookup, approved retention and Core-local qualification remain pending.

## 0.0.14 — 2026-11-25 (unreleased)
- Bounded audit intake and exact evidence digest, source SHA, receipt and current approval binding verification.
- 17 targeted tests including authenticated file receipt integration; strict typecheck of local fixture set and approved-host digest smoke.
- Private durable binding storage and authenticated live lookup remain pending.

## 0.0.13 — 2026-11-25 (unreleased)
- Scoped audit receipt preparation, exact source/evidence binding and proposed private retention policy.
- 17 targeted tests and strict typecheck; approved-host SHA-256 smoke.
- Real retention authorization, binding verification and full audit remain pending.

## 0.0.12 — 2026-11-25 (unreleased)
- Live GitHub connector schema observation and fixture-tested envelope adapter with strict personal-owner validation and minimal metadata projection.
- Ten new tests; 13-file regression (43 Node test entries); strict typecheck of 24 files.
- Live adapter execution, private retention and Core-local qualification remain pending.

## 0.0.11 — 2026-11-25 (unreleased)
- Composed bounded collection and receipt-backed review; sanitized in-memory pages and explicit unobserved review counts.
- Ten new integration tests, full 12-file regression and strict typecheck; approved-host runtime smoke.
- Real audit, model benchmark, private retention and Core scope remain pending.

## 0.0.10 — 2026-11-25 (unreleased)
- Single-attempt receipt write recovery with explicit visibility-versus-durability classification.
- Six fault/recovery tests plus 39 prior storage and integration checks; strict typecheck.
- Core live pipeline, actual crash qualification and macOS durability pending.

## 0.0.9 — 2026-11-25 (unreleased)
- Read-only stored-receipt review adapter; eight integration tests and 31 storage regression checks.
- Strict typecheck and approved-host runtime primitive probe.
- Crash fault injection and live inventory pipeline remain pending.

## 0.0.8 — 2026-11-25 (unreleased)
- Hard-capped receipt file reads, runtime type checks and duplicate retry denial.
- 13 new checks plus 18 receipt-store regression checks, strict typecheck and approved-host runtime primitive check.
- Review integration and crash durability remain pending.

## 0.0.7 — 2026-11-25 (unreleased)
- Authenticated private receipt file-store candidate with immutable publication and logical retention.
- 18 filesystem fixture checks and strict TypeScript verification; approved-host HMAC primitive smoke.
- No production store, key provisioning or Core-local verification.

## 0.0.6 — 2026-11-25 (unreleased)
- Review pipeline joins validated pages, archive observations, decisions and a private receipt-reader interface.
- Exact receipt binding and freshness checks; unresolved evidence remains unknown.
- Nineteen targeted fixture checks, strict typecheck and actual approved-host runtime primitive smoke; no Core deployment.

## 0.0.5 — 2026-11-25 (unreleased)
- Per-repository decision and archive coverage reducer with strict scope, unique IDs and opaque evidence handles.
- Fifteen targeted fixture checks and strict erasable-syntax typecheck; real decision audit and receipt resolution still pending.
- Read-only aggregate model inventory probe; no model execution.

## 0.0.4 — 2026-11-25 (unreleased)
- Typed capability ownership boundaries and source-reviewed dependency matrix.
- Full fixture regression: five scripts, 75 reported checks; strict erasable-syntax typecheck.
- Read-only runtime and model residency probe; no inference or integration claim.

## 0.0.3 — 2026-11-25 (unreleased)
- Per-page deadline, abort signal, typed rate-limit/transport failures; preserve partial coverage.
- Fourteen new fixture checks and strict typecheck; corrected Node strip-only syntax compatibility.
- Reviewed overlapping reducer in PR #3; no merge or deletion.

## 0.0.2 — 2026-11-25 (unreleased)
- Injected bounded pagination reader, strict normalization, sanitized failure states and 13 fixture cases.
- Refreshed related dependency metadata and verified terminal availability again. Core-local mapping still blocked.
- Preserved parallel draft PR #3; continued #4 without merge.

## 0.0.1 — 2026-11-25 (unreleased)
- M00 inventory coverage validator and nine synthetic assertions.
- Evidence checkpoint for personal GitHub enumeration and existing terminal reachability; no Core-local execution claimed.
- Stacked draft implementation; no release, merge, deployment or permission expansion.
