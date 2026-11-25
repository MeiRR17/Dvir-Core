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

## v0.0.2 fixture run (isolated Linux, not owner Mac)
- Node v22.16.0; TypeScript 5.8.3.
- node --experimental-strip-types paginate.test.ts — exit 0, 14 assertions passed.
- tsc --noEmit --strict --target es2022 --module nodenext --allowImportingTsExtensions coverage.ts paginate.ts paginate.test.ts — exit 0.
- Git blob hashes matched local tested bytes: coverage.ts 1ebae7e461d6687a89a4e77177cb3d6a5af94567; paginate.ts 25ce263cdc77188b280f1dddac1e21b59271d925; paginate.test.ts 1c4849954ac061b44260ad4b49fbd0a2af26f1b3.
- Mock transport only. Stable offset pagination is a transport precondition; page cap is not a request timeout. No actual GitHub calls by new code, no Core-local deployment. Raw inventory and machine observations not stored.
