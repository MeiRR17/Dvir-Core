# Tool inventory
| Tool/channel | Decision | Evidence/limit |
|---|---|---|
| Existing GitHub connector | reuse | owner-filtered enumeration and scoped Core writes available; no org access |
| Existing private terminal MCP | reuse | actual read-only command/session polling verified; Core mapping not advertised |
| Terminal filesystem/git write tools | defer | not exercised; no Core scope |
| Ollama/local model adapters | evaluate | runtime probe only; no inference or tool-call test |
| External MCP candidates | planned | review official registry, license, maintenance, egress, cost and overlap before adoption |
| Corpora / Neo4j / Apex / Autopilot / Hermes | reuse candidates | full source/contract audit outstanding |

No install, permission expansion, public endpoint or duplicate terminal server.

0.0.2: added injectable bounded page reader for normalized connector-shaped repository responses, synthetic only. Related dependency default-branch/PR metadata refreshed; full interface, license and overlap audit pending. Existing terminal remains the sole approved execution channel for local host checks.

0.0.4: [source review and ownership matrix](DEPENDENCY_AUDIT.md) recorded. No external MCP installation or duplicate terminal bridge. No browser automation dependency introduced.

0.0.12: verified the existing GitHub list_repositories response shape using personal-owner bounded reads. Added fixture-tested injected connector reader. No live runtime wiring, additional connector or scope expansion.

0.0.17: reused PR #13's shared authenticated JSON storage primitive inside the single M00 candidate. No new terminal MCP, external MCP installation, server bridge, permission expansion or Core host access. Existing Core terminal scope remains OWNER_BLOCKED.
