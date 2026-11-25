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
