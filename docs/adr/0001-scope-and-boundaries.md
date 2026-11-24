# ADR 0001 — Dvir Core scope and boundaries
Status: Proposed
Date: 2026-11-23

## Context
Dvir OS is the product umbrella, with Ma'ir day/week and Zion long-horizon experiences. A companion infrastructure platform is needed to inventory devices, installed software, services, AI models, agents, GitHub projects, storage and workflows, and provide reliable current-state answers.

## Proposed decision
Use Dvir Core as the infrastructure control plane and Dvir OS as the product experience. Begin with a local-first modular monolith and read-only asset discovery, rather than a separate AI-only dashboard or mandatory NAS platform. Maintain strict source-of-truth boundaries and explicit approval for execution.

## Consequences
+ One shared registry and operational evidence model across modules.
+ Enables future distributed workers without requiring them initially.
+ Reduces duplicated agent and storage administration.
- Requires API contracts, access policies and inventory freshness rules.
- Requires alignment with latest Dvir OS ADRs and canonical Drive plans before adoption.

## Alternatives
1. Put everything in Dvir OS: fewer repositories, but mixes infrastructure lifecycle with personal product UX.
2. Separate microservice per domain: premature operational complexity.
3. AI-only local router: insufficient for software inventory, fleet, storage and agent coordination.

## Follow-ups
Confirm repository ownership, security model, data retention, schema, API boundaries and deployment topology. No infrastructure deployment is authorized by this ADR.
