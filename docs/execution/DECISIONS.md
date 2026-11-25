# Execution decisions
- D001 (0.0.1): stack on exact reviewed plan SHA, not main; no merge or deployment. Use GitHub contents API while existing terminal connector does not advertise Core.
- D002: pure TS inventory aggregation; reject mismatched owners, duplicate IDs and invalid offsets; require an explicit empty page to mark enumeration complete. This assumes stable provider offset pagination and does not prove snapshot consistency. No external dependency introduced.
- D003: public repository is not a private inventory store. Keep actual private repo names, raw machine output, session IDs and model identifiers out of commits. No organization data requested. Use synthetic fixtures.
- D004: reuse existing terminal connector. No replacement bridge, installation, permission change or cross-project filesystem traversal. Runtime discovery is not a model benchmark.
- D005: Dvir OS retains product UX and Apex/PCI status semantics. Refresh of linked OS integration branch and master-plan sections confirms TS-first/one PCI engine; complete ADR review remains open.
