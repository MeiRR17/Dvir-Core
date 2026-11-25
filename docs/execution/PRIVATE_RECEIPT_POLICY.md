# Private audit receipt policy — proposed, not owner-approved

Version 0.0.13. This is an implementation candidate, not permission to retain real private data.

- Source scope: explicit personal-owner repository IDs, exact audit revision and explicit expiry. No organization or third-party materials.
- Trusted owner approval must be authenticated outside the pure preparation function. A model-generated approval object is not authorization.
- Proposed maximum validity: 30 days from observation, further capped by the approval expiration; shorter limits supported. Expiry blocks use, not physical deletion. Owner must approve retention duration, storage location, backup and disposal policy before real persistence.
- Prepare a minimal receipt and separate private binding: exact source commit, digest of reviewed evidence, decision, observation timestamp, scope and approval reference. Keep both private. The deterministic SHA-256 handle binds the fields, not source truth; it is not a secret or access token.
- Use an explicitly approved private directory with trusted ancestry, owner-only permissions, managed secret and restricted access. Existing HMAC store authenticates receipt payload, not upstream evidence. Binding persistence, verification on read, encryption decision, key lifecycle and revocation remain open. No production store provisioned.
- Public Git contains fixture code, policy and sanitized acceptance evidence only. Do not publish identifiers, raw source excerpts, private digests, approval records, host paths or credentials.
- No automatic deletion. Owner-approved disposal and backup retention procedure must be verified separately.

## M00 remaining acceptance
Actual per-repository decisions with source-linked private evidence; approved private retention and authenticated approval path; existing terminal scope and Core mapping; local runtime/model observations with limits; source/branch audit coverage and unknowns. Live adapter execution and crash/durability verification remain separate gates. A fixture pass does not close any missing live or owner gate.
