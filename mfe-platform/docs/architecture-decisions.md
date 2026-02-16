# Architecture Decisions (ADR Summary)

This document captures core engineering decisions for portfolio-grade runtime microfrontend composition.

## ADR-001: Runtime Remote Discovery via Registry
- Status: Accepted
- Decision: The host resolves remote URLs from the runtime registry manifest (`/api/registry`) and never hardcodes remote entry URLs in host code.
- Rationale: Enables independent deployments, environment-based routing, canary rollouts, and safe fallback without host rebuilds.
- Consequence: Registry payload becomes a critical contract and must be validated and observable.

## ADR-002: Shared Contracts Package for Boundaries
- Status: Accepted
- Decision: Cross-app events and shared types live in `@mfe/platform-contracts`; UI primitives live in `@mfe/ui-kit`.
- Rationale: Prevents direct host-remote imports and keeps bounded contexts independent.
- Consequence: New cross-app APIs must be versioned via shared package release discipline.

## ADR-003: Fail-Safe Runtime Loading
- Status: Accepted
- Decision: Remote loading includes retries with exponential backoff, canary-to-stable fallback, degraded UI fallback page, and status tracking.
- Rationale: Network instability and remote outages are expected failure modes in distributed frontend architectures.
- Consequence: Host remains operational in partial outage scenarios and emits telemetry for incident analysis.

## ADR-004: Manifest Contract Validation at Consumer Edge
- Status: Accepted
- Decision: Frontend validates manifest schema at runtime (`parseRegistryResponse`) before route/render usage.
- Rationale: Protects host from malformed payloads and version skew between registry and shell-host.
- Consequence: Contract tests are required to assert compatibility and prevent schema drift.

## ADR-005: Clean Dependency Boundaries
- Status: Accepted
- Decision: Feature apps may depend only on shared packages (`@mfe/platform-contracts`, `@mfe/ui-kit`) and external libraries; no remote↔remote or remote→host imports.
- Rationale: Avoids circular dependencies and preserves deployability of each microfrontend.
- Consequence: Integration must happen through runtime contracts/events rather than direct module imports.
