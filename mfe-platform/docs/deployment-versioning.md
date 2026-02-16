# Deployment and Versioning Strategy

## Deployment Model
- Host and each remote are independently deployable artifacts.
- Registry controls runtime composition by publishing stable/canary URL + version metadata.
- No host redeploy required for remote URL/version changes when contract remains compatible.

## Versioning Rules
- Shared contracts (`@mfe/platform-contracts`) and shared UI (`@mfe/ui-kit`) are versioned as first-class APIs.
- Breaking changes require major version bump and migration plan.
- Registry route schema changes require consumer-compatible rollout (additive first, destructive later).

## Canary Rollout Flow
1. Deploy remote canary artifact.
2. Update registry canary URL/version.
3. Enable canary with percentage via admin API/UI.
4. Observe telemetry and error rates.
5. Promote to stable or roll back by disabling canary.

## Failure and Rollback
- If canary load fails, host falls back to stable remote automatically.
- If registry fetch fails, host uses last-known-good cached manifest (bounded TTL).
- If remote fails entirely, host enters degraded mode with retry controls.

## Environment Configuration
- Remote URLs are environment-driven through app-registry config (`app.registry.remotes.*`).
- Recommended environments: `dev`, `staging`, `prod` with dedicated registry values.

## CI/CD Expectations
- Required gates: unit tests, contract tests, build.
- Optional gate: e2e suite in controlled pipeline stage.
- Recommended release metadata: git SHA, build timestamp, semantic version for each remote.
