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

Both final direct test callbacks close with an extra parenthesis. Agent B owns `src/runtime/**`; Agent A did not edit runtime source or fixtures. The exact fix and runtime review remain pending from B.

## Strict typecheck

The strict typecheck ran independently after the runtime test failure. It reported only the two syntax diagnostics above; no additional TypeScript diagnostics appeared in this run. This is not a successful full typecheck.

## Interpretation and gates

- Agent A's complete inventory/authenticated-storage test partition passes on this exact SHA.
- Runtime remains red until B corrects the two test files and reviews the integrated runtime contract.
- Full suite remains FAIL; M00 is not complete.
- MLX descriptor-relative traversal, Linux/macOS/APFS qualification, Core terminal mapping, approved private retention/key policy and actual runtime qualification remain open.
- No merge, deployment, model loading or inference is authorized by this evidence.
