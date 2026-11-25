# Evidence — 0.0.1
## Fixture run (isolated development environment, not owner's Mac)
- Node v22.16.0; TypeScript 5.8.3.
- In src/inventory: `node --experimental-strip-types coverage.test.ts` — exit 0, nine assertions passed.
- `tsc --noEmit --strict --target es2022 --module nodenext --allowImportingTsExtensions coverage.ts coverage.test.ts` — exit 0.
- Code commit 39a2b8503b29bd4790a3ce735f2f2a757f2a92d9; test commit 2f162b20b911765ae3733d5b52b01032267b340b.
- Tested blob hashes verified via GitHub fetch: coverage.ts 1ebae7e461d6687a89a4e77177cb3d6a5af94567; coverage.test.ts 073b14aaf3ee59cc2ceeaa5f0c7712bed0be95b9.
- Scope denial, duplicate ID rejection, pagination rejection, incomplete inventory and empty-page termination covered. No production build or end-to-end integration yet.

## Real connector observations (2026-11-25)
- GitHub list_repositories owner-filtered, page_size=100, offsets 0 and 100; second response empty. Returned owners matched requested personal account. Counts/private identities withheld from public record. Not an audit of every repository's source or branch.
- Existing terminal MCP: two approved-project read-only terminal_execute sessions polled with terminal_read_output; both finished with exit 0. Runtime availability/version probe succeeded; detailed host output withheld. Separate git_status returned 128 (approved directory not a git repo). No Core checkout or test execution on owner Mac.
- Sources: [Core foundation PR #1](https://github.com/MeiRR17/Dvir-Core/pull/1), [master plan PR #2](https://github.com/MeiRR17/Dvir-Core/pull/2). Linked Dvir OS integration PR and master-plan sections checked read-only; full ADR and related repo audit pending. Private source identifiers not published.

## 0.0.2 — bounded inventory reader
- Isolated fixture environment: Node 22.16.0, TypeScript 5.8.3. From src/inventory: `node --experimental-strip-types collect.test.ts` (13 fixture cases passed, exit 0); `tsc --noEmit --strict --target es2022 --module nodenext --allowImportingTsExtensions coverage.ts collect.ts collect.test.ts` (exit 0).
- Tested remote blob hashes: collect.ts 8a09aebe68c0e07bc4e8d17c9a07dfda9f3b5851; collect.test.ts ddc3532731f71f80e3d160dafa0f3c0a4cddabd8; unchanged reducer 1ebae7e461d6687a89a4e77177cb3d6a5af94567. Code/test HEAD 6e5068dc5d39f1c6ad2fef28c0bb82000fe5a609.
- Terminal read-only runtime availability rechecked via approved scope: command completed with exit 0. Core not advertised; no Core checkout or inference benchmark.
- Read-only refreshed default-branch commit and up to three open PRs for six related repositories; raw private refs withheld. No contract parity or full repository audit claimed. Concurrent M00 draft PR #3 identified; left untouched.

## 0.0.3 — page deadline and failure classification
- Isolated Linux environment: Node 22.16.0, TypeScript 5.8.3. Initial strip-only execution failed because of a TS parameter property; replaced it with an explicit field and assignment. Final `node --experimental-strip-types deadline.test.ts` and `node --experimental-strip-types collect-deadline.test.ts` each exit 0 (7 checks each). `tsc --noEmit --strict --target es2022 --module nodenext --allowImportingTsExtensions *.ts` in the isolated fixture directory exit 0 (coverage, collect, deadline and both new test files). Older test files were not rerun in this cycle.
- Local git hash-object and remote fetch_file blob SHA matched: coverage.ts 1ebae7e461d6687a89a4e77177cb3d6a5af94567 (unchanged); collect.ts 2bd86e07ffd609ce95ff572ebc2be6129ff3eef2; deadline.ts d3de8e764050176eeedb1881cfacc85d8ede7b1a; deadline.test.ts e5ad79ff8019c96721efa3555cf4f21d6cb169f5; collect-deadline.test.ts d038b695f9f1a4027ecf27abc0ef35ce73cf7777. Code HEAD eae1efd04f0e567c41cd37eee3ce49ec5955e464.
- Timeout returns partial coverage and requests abort; reader may ignore signal, no guarantee of transport cancellation. Explicit rate-limit classification only for typed PageReadError; untrusted errors are sanitized. No automatic retry. No end-to-end live collector test.
- Existing terminal approved-project read-only runtime diagnostic completed with exit 0, Core not advertised. Direct GitHub clone in isolated environment failed DNS resolution (exit 128); used authorized connector instead. No Core-local execution claimed.
- Inspected competing PR #3 reducer: name-based deduplication, archive counts, foreign-owner filtering versus #4 ID-based strict scope denial. Preserve both drafts; recommend strict-deny semantics and a separately validated archive observation if needed. No merge or branch deletion.
