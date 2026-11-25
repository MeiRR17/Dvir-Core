# Execution decisions
- D001 (0.0.1): stack on exact reviewed plan SHA, not main; no merge or deployment. Use GitHub contents API while existing terminal connector does not advertise Core.
- D002: pure TS inventory aggregation; reject mismatched owners, duplicate IDs and invalid offsets; require an explicit empty page to mark enumeration complete. This assumes stable provider offset pagination and does not prove snapshot consistency. No external dependency introduced.
- D003: public repository is not a private inventory store. Keep actual private repo names, raw machine output, session IDs and model identifiers out of commits. No organization data requested. Use synthetic fixtures.
- D004: reuse existing terminal connector. No replacement bridge, installation, permission change or cross-project filesystem traversal. Runtime discovery is not a model benchmark.
- D005: Dvir OS retains product UX and Apex/PCI status semantics. Refresh of linked OS integration branch and master-plan sections confirms TS-first/one PCI engine; complete ADR review remains open.

- D006 (0.0.2): fixed-width offset reader accepts a short page only if followed by an empty page. A nonempty successor is invalid; incomplete coverage is preserved on transport/validation errors. Maximum 100 requests; reader supplies deadline/cancellation; no retry or rate-limit distinction yet. This is a fixture-tested contract, not a guarantee of stable live pagination.
- D007: continue PR #4, preserve parallel PR #3; reconcile before integration, no duplicate merge. Dependency metadata refreshed; no private refs exported.

- D008 (0.0.3): enforce per-page deadline (1–60000 ms; default 10000) with AbortSignal; stop on failure with prior valid coverage; no retries. Reader may ignore cancellation, so never claim transport actually stopped. Only typed transport errors can classify rate limits; no raw error detail in results.
- D009: reviewed parallel PR #3 reducer; prefer stable ID and strict foreign-owner rejection in #4; archive-count capability may be integrated separately after review. Both PRs preserved.

- D010 (0.0.4): encode capability ownership as a pure typed map, deny unknown/mismatched ownership and return copies. This is an architecture consistency check, not authorization. Preserve Dvir OS, Apex/PCI, Corpora, Neo4j, Autopilot and existing terminal ownership; Hermes remains evaluation only. See DEPENDENCY_AUDIT.md.

- D011 (0.0.5): per-repository decision summary requires unique stable IDs, strict owner scope, explicit archive observation and a syntactically valid opaque receipt handle for every non-unknown decision. This incorporates the archive-count concept from parallel PR #3 without merging it. Complete requires confirmed enumeration and zero unknown decisions. The receipt handle is not proof of underlying evidence; a private resolver and retention policy remain necessary. Only aggregate counts returned; no live classifications or approval claims.

- D012 (0.0.6): review pipeline validates normalized page scope and explicit archive observations before any receipt lookup. A trusted private reader supplies receipts; exact handle, owner, repository, decision, revision and freshness must match. Failed resolution becomes unknown. Single supplied revision is an audit snapshot binding, not proof of per-repo source HEAD. Reader is synchronous and assumed bounded; no durable store or cryptographic authentication yet. No private receipt IDs or raw errors in result.

- D013 (0.0.7): filesystem receipt-store candidate uses HMAC-SHA256 with a caller-supplied secret, private owner-only directory/files, exclusive temporary file and hard-link no-overwrite publication, file and directory fsync. Reads fail closed on expired, mismatched, malformed or tampered evidence. Retention currently logical only, no deletion or encryption. Caller must provision trusted directory ancestry and manage secrets; do not commit receipts or keys. No production storage decision or installation authorized. Verify bounded read, runtime schema, crash recovery and macOS support before integration.

- D014 (0.0.8): replace unbounded readFileSync with capped readSync loop (4096-byte payload limit plus sentinel), reject non-string fields and invalid key type before use. Preserve no-overwrite semantics: caller may read the original receipt to reconcile a duplicate retry, but no post-crash durability claim. Trusted directory and same-UID assumptions remain. End-to-end integration and crash fault injection deferred to next increment.

- D015 (0.0.9): expose read-only stored-review adapter binding one owner and one clock for receipt verification and review reduction. Invalid configuration rejected; missing or altered receipts remain unknown. Synthetic fixture integration is not live connector, production evidence, or crash durability qualification. No new service, key provisioning, or permission expansion.

- v0.0.10: compose existing collector, reader from PR #12 and review engine; keep minimized pages in memory, return aggregate-only result, never resolve evidence on incomplete enumeration, sanitize invalid review errors. Injected resolver allows existing private store integration without creating another store. No live adapter execution or actual source authenticity claim. Base 2af0d0b; previous draft PRs preserved.

- v0.0.11: compose existing pipeline and authenticated receipt store; use one snapshot of owner/time configuration and open store before provider invocation. No writes, no credentials persisted, no raw results returned. Continue PR #13 to avoid draft proliferation; parallel PR #4 has additional work not integrated yet.

- v0.0.12: reconcile selected parallel code without merge or branch deletion. Shared internal collector minimizes accepted pages; generic authorized partial-review path preserves partial decisions; strict GitHub pipeline never resolves evidence until enumeration completes. Import receipt recovery classification; observed-after-error is visibility only, not durability. Keep remaining parallel docs/history intact in PR #4 for review.

- v0.0.13: isolate Ollama metadata validation from actual transport. Use documented tags and ps response shapes; null means unobserved, empty list means observed empty. Distinguish entries from unique digests; cross-list mismatch is an observation, not proof of failure. Size sums are provider-reported per-entry, not measured disk or RAM. No identifiers or raw payloads returned. No inference/benchmark claims; no new service or permissions.

- v0.0.14: explicit local-only metadata probe via Node HTTP to fixed 127.0.0.1 and two GET routes. Default port 11434, caller-selected numeric port for approved service/test only; no endpoint authentication or service identity proof. Per-route time and 1 MiB body bounds, no redirect, no proxy, no retries, no inference or cloud fallback. Independent sanitized status for each route; no raw model records returned. Actual deployment requires approved Core scope.

- v0.0.15: bounded pure benchmark reducer for local Ollama/MLX inputs, median first-token latency and decode throughput, complete-only peak process memory and success counts. Caller-supplied source label is not proof of execution. No raw prompts or model IDs in summary; no inference, runtime selection, or live integration. MLX discovery remains pending.


## 0.0.17 — benchmark evidence contract
Use exact ordered normalized measurement digests instead of aggregate hashes, a trusted private receipt resolver, explicit approved workload identity and a provisional maximum receipt lifetime of 24 hours. Unmatched local summaries remain unavailable; fixture results retain their label. This is a binding contract, not an authentication or execution claim. Authenticated persistence, trusted clocks and actual local evaluation remain gated.


## 0.0.18 — benchmark receipt storage
Use a dedicated directory and separate HMAC domain from inventory receipts; preserve existing inventory storage unchanged. Reuse its bounded read/atomic publication pattern; consolidate the shared filesystem primitives in a later tested increment rather than altering existing receipt format now. Caller provides trusted directory, key and clock. No encryption, automatic deletion, key rotation or inference attestation claimed.


## 0.0.19 — read-only stored benchmark review
Compose the existing verifier and store without introducing a second signing interface. Fixtures and unmeasured inputs never open storage. Missing or unsafe storage fails closed; orphan temporary files are ignored without automatic deletion. Caller authorization, key provisioning, retention, process-crash testing and shared filesystem primitives remain outstanding.
