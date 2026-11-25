# M00 personal-repository screening — 2026-11-25

Status: **SCREENING_PARTIAL**. This is a source-boundary audit, not a complete source-code, branch or manifest audit. It does not authorize integration, private-data retention, external access or deployment.

## Enumeration evidence

- Queried only the authenticated personal owner filter MeiRR17; no organization-owner query was made.
- Page size 100: first page returned 83 repositories; offset 100 returned an empty terminal page.
- 83/83 records had unique positive IDs; no duplicate IDs, missing default branches or archived records were observed in this snapshot.
- README availability: 69 repositories had a readable README; 14 were empty or had no readable README. Those 14 remain UNKNOWN, not NOT_APPLICABLE.
- Read README and available agent/roadmap/architecture material for the integration-relevant projects below. Branch/PR metadata was sampled for 14 active candidates. Several high-activity repositories returned the 100-result cap; their branch/PR coverage is therefore incomplete.
- No organization repository, organization source, private corpus, host path, secret or raw repository record was copied into this report.

## Integration boundary decisions

| Domain owner | Core decision | Boundary |
|---|---|---|
| Dvir OS | **ADOPT — client/control-plane contract** | Dvir OS owns Ma'ir/Zion, goals, priorities, approvals and user experience. Core owns local infrastructure, registry, policy, runtime and tool orchestration. Core must not become a second Dvir OS UI or copy its domain logic. |
| Apex Hub | **REUSE — read-only project metadata only** | Apex is a private, read-only GitHub launcher. Do not duplicate its navigation UI or turn it into an execution engine. Dvir OS remains the product-facing Projects/PCI surface. |
| Corpora | **ADOPT LATER — rights-aware catalog adapter** | Corpora owns catalog, rights and source locators. Core may call an approved bounded read API; never copy raw corpus, bulk-ingest archives or treat upload evidence as rights approval. |
| Neo4j | **ADOPT LATER — bounded read-only research API** | Neo4j owns graph schema, ingestion, migrations and scholarly evidence. Core must not connect end-user clients directly to Bolt or expose arbitrary Cypher. |
| Autopilot | **REUSE — development-workflow adapter** | Autopilot owns project execution workflow and chat-worker lifecycle. Core may expose a typed adapter; do not build a competing scheduler or autonomous development engine. |
| Blog | **DEFER — read-only content/search adapter** | Blog owns its content and editorial pipeline. No copying of its database or publishing logic into Core. |
| Music | **DEFER — status/asset metadata only** | Music owns composition, voice, recording and production. No raw audio, voice model, credentials or release actions in Core. |
| Taamify / Kolmud Studio | **DEFER — optional domain adapters** | Their cantillation/voice-learning models and workflows remain domain-owned. Core may later consume approved status or capability metadata, not model artifacts or learner recordings. |
| Timeline | **DEFER — context adapter** | Timeline owns day planning, transit, calendar and zmanim experience. Core may provide bounded context/tool interfaces; it must not duplicate the product or data logic. |
| Israel Evidence Atlas | **DEFER — evidence-search adapter** | IEA owns public-claim provenance and editorial review. Core may later expose a scoped read adapter; no copied evidence database or editorial authority. |
| IDEA | **DEFER — idea-catalog adapter** | IDEA owns idea capture, attribution and refinement. Keep its product boundary; do not move its workflow into Core. |
| Eruv / CivicFlow | **DEFER — domain adapters only after contract** | Eruv owns halachic infrastructure monitoring; CivicFlow owns civic/traffic evidence cases. No duplicated domain decisions or cross-project data migration. |
| netload | **REUSE LATER — bounded network diagnostics** | Treat as a possible local collector behind the existing terminal MCP. Do not install a second daemon or create another terminal bridge. |
| Master-Courses | **NOT_APPLICABLE under current scope** | Its AGENTS.md explicitly limits it to academic course material and excludes Dvir OS refactoring. No course content or student account data in Core. |
| AttendanceSystem | **NOT_APPLICABLE** | README describes fingerprint attendance, student records and external notifications. Exclude biometric/student data and notification actions from the personal Core plane. |
| Learning_Modules and standalone utilities | **NOT_APPLICABLE by default** | Reuse a pinned library only when a measured Core requirement justifies it; do not turn Core into a general app launcher or duplicate utility collection. |
| Historical/organization-consolidated sources | **EXCLUDE** | Several personal repositories identify their former source as moved into DevTeam1770/infrastructure. Do not query or ingest the organization repository or its data. |
| Empty/README-missing repositories | **UNKNOWN** | No adoption decision until a source, owner and purpose can be established. |

## Selected branch/PR observations

These are snapshots, not readiness claims:

- Dvir OS: PR #326 is Draft/HOLD, based on codex/complete-pci-20261119. Its master plan says external repositories are presented through Projects/PCI rather than copied. Core must preserve that boundary.
- Apex: PR #7 is Draft and targets main.
- Corpora: PR #451 is explicitly not merge-ready; the repository has more than 100 visible branches/open PR search results, so the sample is capped.
- Neo4j: PR #75 is Draft and stacked on PR #74; the graph/research API remains a separate domain service.
- Blog: PR #21 is Draft and targets main.
- Music: PR #57 is Draft research work; voice/audio remains owner-local.
- Timeline: PR #44 is Draft and targets main.
- IDEA: one open Draft PR observed.
- IEA and Master-Courses: branch and open-PR searches reached the 100-result cap; no full branch inventory or merge-readiness conclusion is claimed.
- Autopilot: one branch and no open PR observed in this snapshot.
- netload, Eruv, CivicFlow and Kolmud Studio have active open PRs; these remain domain-owned and are not automatically adopted.

## Next audit work

1. Resolve the 14 empty/README-missing repositories through a safe owner/purpose/source check; do not infer deletion or archive intent.
2. Paginate branches and PRs for the high-activity repositories and map current default-branch SHAs, unique source trees, AGENTS, manifests, tests and active plans.
3. For each candidate adapter, inspect the exact source contract and authorization model; record ADOPT / DEFER / NOT_APPLICABLE / UNKNOWN with source SHA.
4. Obtain owner approval for any private evidence retention, key provisioning, retention, backup, rotation or deletion. Until then, keep only synthetic fixtures and redacted aggregates.
5. Keep organization data excluded and do not treat a README reference to an organization repository as permission to access it.

## Source snapshot references

The following are exact Git blob SHAs of the source documents inspected in this pass:

| Repository | Document | Blob SHA |
|---|---|---|
| dvir-os | README.md | 3857dc5f90c6bead6f22e7ac1f8d6e450c122e29 |
| dvir-os | AGENTS.md | a8c75b6bce220ea294cd3d785829f72919aefd97 |
| dvir-os | master plan (R1 branch) | 4b3a2e2dfc137a66dd3a3ea3af501e4dc7153e70 |
| dvir-os | project execution map | 7666e0f02250b1c02e052836ff0b978e36b78102 |
| dvir-os | product requirements | e3a6cf9269785ad9d7dce105f194006ed09af8c1 |
| Apex | README.md | 8f0cbe48f59cc143894865ede7ff105c1b874685 |
| Apex | AGENTS.md | 9f2ed40ba6965bbd162fc4410f711023639474b0 |
| Apex | ROADMAP.md | 322721b8a536d7d450b4126b0dfd81996db0fa0b |
| Corpora | README.md | a97ad7ab6ea0764aa0e79635e4570661ece15eee |
| Corpora | collections/README.md | 8c1910a6939509698c25a1a2af7159a95c7e59a9 |
| Corpora | coverage audit | cad5de898f57213f5d79bef8583f882e6a49afb9 |
| Autopilot | README.md | 1d8bb5f4e5f9e1bb8fab10a4434243fb5d9946fb |
| Autopilot | docs/autopilot/PLAN.md | 977ccb6c54494b1190978818b71c516efcdf29d7 |
| Music | AGENTS.md | 0384f7c30657e35dbb5fc47eff34d84fc9f56b1a |
| Music | ROADMAP.md | 58ad9000f7c5ec3ca1a5fbecf1895f7d37664bf2 |
| Timeline | AGENTS.md | 149939e42510c571b4b8d30ddc3bb1fb6d92a10a |
| Timeline | orchestrator | fbd5706c827f06fe011c0b81fe831ded986711d4 |
| Timeline | STATE.md | bf9de77881547f1c48224988b11b4ba743a0c650 |
| Timeline | PIPELINE.md | 9118617340cf7c9e98459cb31e20f4a8329f1991 |
| Neo4j | README.md | dca59dc8ebde6b1944cb28809b43ed4cd8f4d02e |
| Neo4j | ROADMAP.md | c3dee6394ace3a17b10e11052f567722d1e8de41 |
| Neo4j | DvirOS integration ADR | 4febf6086cc112c9bdd493423f9ee1588984e276 |
| Blog | README.md | 9120eaa998540aeb435d51d53c4bb6eddc87599b |
| Blog | ROADMAP.md | 99600714d001468402fdb39fd8dfc9aa7e9faaf7 |
| Master-Courses | AGENTS.md | 971b27c09e6e961446a447c388e3c2b2c6bae55a |
| Master-Courses | README.md | 0b8c19eb475f1514feb3f4cc200bf8993904bf63 |
| Israel Evidence Atlas | README.md | b2f594ebe476ff6844efa41402f587306c64f681 |
| IDEA | README.md | 997497801fc5cddef20e467153a502570c129df2 |
| netload | README.md | 5ad321bfd3ab989150bbf264693bc93a71d9dd87 |
| Eruv | README.md | 7fb87491f8ade0bfbcf6c497132ee1b2b01ba280 |
| CivicFlow | README.md | 22cd7feec6b82af9294d9b11fdb93908d92b8d89 |
