# Dvir Core

Infrastructure control plane for **Dvir OS**. Dvir Core inventories devices, software, services, models, agents, repositories, storage and their relationships; it does not replace Dvir OS's Ma'ir/Zion product experience.

**Status:** requirements and architecture proposal; no live discovery, orchestration, deployment or model integration is claimed.

## Principles
- Local-first, least privilege, read-only discovery before automation.
- GitHub is the source of code; canonical Dvir OS planning documents remain in Google Drive.
- No raw research corpus uploads, no new pay-as-you-go AI spending, no public network exposure by default.
- No autonomous merges, publishing, financial actions or external messaging without approval.
- Laptops can sleep: jobs require checkpoints and recovery; no assumed 24/7 uptime.
- Start as a modular monolith, not a fleet of microservices.

See [requirements](docs/PRODUCT_REQUIREMENTS.md), [architecture](docs/ARCHITECTURE.md), [roadmap](docs/ROADMAP.md), and [decisions](docs/adr/0001-scope-and-boundaries.md).

This repository is a proposed infrastructure companion to [Dvir OS](https://github.com/MeiRR17/dvir-os), subject to alignment with its latest ADRs and canonical plans.
