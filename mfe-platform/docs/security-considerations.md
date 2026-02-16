# Security Considerations

## Authentication and Authorization
- JWT-based auth with role claims (`ADMIN`, `USER`) from app-registry.
- Host enforces role-gated route rendering.
- Admin APIs require bearer token validation and explicit admin-role authorization.

## Token Handling
- Access tokens are memory-only in the shell host.
- No token persistence in local/session storage in current implementation.
- Production recommendation: short-lived access tokens + rotating refresh tokens in HttpOnly secure cookies.

## Manifest and Remote Loading Safety
- Registry payload is runtime-validated by frontend schema parser before use.
- Manifest parse errors are logged as structured events (`manifest.parse.failure`).
- Remote load failures emit telemetry and trigger user-visible fallback mode.

## CORS and Transport
- CORS currently configured for local development origin.
- Production recommendation:
  - Restrict allowed origins to known host domains.
  - Enforce HTTPS/TLS on all traffic (host, remotes, registry).
  - Use HSTS and secure cookie flags where applicable.

## Supply Chain and Dependency Hygiene
- Workspaces pin semver ranges; shared libs are centrally aligned.
- CI should include dependency audit and SCA scanning.
- Production recommendation: signed artifact provenance and immutable image tags.

## Logging and Data Handling
- Correlation headers (`X-Session-Id`, `X-Request-Id`, `X-Correlation-Id`, `X-User-Id`) support traceability.
- Telemetry storage is in-memory for local/demo use.
- Production recommendation: central log sink + redaction policy + retention controls.
