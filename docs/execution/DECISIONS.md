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
