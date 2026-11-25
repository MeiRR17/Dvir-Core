# Candidate CI run 113 — split ownership validation

Date: 2026-11-25
Candidate branch: `integration/m00-consolidated-20261125`
Exact tested HEAD: `6844eb99df684d803450b07c2cf53b9ed80a6589`
GitHub Actions run: https://github.com/MeiRR17/Dvir-Core/actions/runs/45649248499
Job ID: `139328879214`
Environment: ubuntu-latest, Node v22.18.0, TypeScript 5.9.3, @types/node 22.20.5

## Test partition results

| Ownership | Command | Entries | Passed | Failed | Result |
|---|---|---:|---:|---:|---|
| Agent A — inventory + authenticated storage | `npm run test:inventory-storage` | 105 | 105 | 0 | PASS |
| Agent B — local runtime | `npm run test:runtime` | 55 | 53 | 2 | FAIL |
| Combined | both partitions | 160 | 158 | 2 | FAIL |

The split is a reporting boundary only; `npm test` remains the single full-suite command over inventory, runtime and storage.

## Runtime failures

- `src/runtime/mlx-inventory.test.ts(61,3)`: Node parse error `ERR_INVALID_TYPESCRIPT_SYNTAX`; TypeScript reports `TS1005: ';' expected`.
- `src/runtime/ollama-local.test.ts(36,3)`: same parser and compiler error.

The two extra closing parentheses were introduced by Agent A while adapting the B-supplied test fixtures to the candidate's owner-configured probe factories. The corresponding PR #13 source tests at B's input SHA were syntactically valid. Agent A corrected only the two final delimiters in the candidate: `src/runtime/mlx-inventory.test.ts` commit `a7145f28fcb5b450b40d3ffd66a3a8381cd0cf1c` and `src/runtime/ollama-local.test.ts` commit `b81bc994a0d84dd758a2af916b221083fc6c28a3`. PR #13 remains unchanged. Run #113 is historical evidence for the pre-fix candidate; CI revalidation on the new HEAD is pending. Agent B's read-only review of the integrated runtime trust boundaries remains pending.

## Strict typecheck

The strict typecheck ran independently after the runtime test failure. It reported only the two syntax diagnostics above; no additional TypeScript diagnostics appeared in this run. This is not a successful full typecheck.

## Interpretation and gates

- Agent A's complete inventory/authenticated-storage test partition passes on this exact SHA.
- Runtime remains red until B corrects the two test files and reviews the integrated runtime contract.
- Full suite remains FAIL; M00 is not complete.
- MLX descriptor-relative traversal, Linux/macOS/APFS qualification, Core terminal mapping, approved private retention/key policy and actual runtime qualification remain open.
- No merge, deployment, model loading or inference is authorized by this evidence.
