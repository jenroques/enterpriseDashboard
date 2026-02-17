# Heroku Deployment Guide

This monorepo is deployed to Heroku as **one standalone app** (single dyno, single URL):

- Spring Boot (`services/app-registry`) is the only web process
- Shell frontend (`apps/shell-host`) is built at deploy time
- Frontend build output is copied into Spring static resources
- Remote build outputs are copied into Spring static resources under `/remotes/*`
- Spring serves both API (`/api/*`) and SPA (`/`, `/accounts`, etc.)

## 1) Prerequisites

- Heroku CLI authenticated (`heroku login`)
- Git repo connected to Heroku
- Heroku stack supports Node + Java buildpacks (default Heroku-22 works)

## 2) Create one Heroku app

```bash
heroku create mfe-enterprise-dashboard
```

## 3) Configure buildpacks

Use Java + Node buildpacks at the monorepo root (Java first so `java` is available when Node runs `heroku-postbuild`):

```bash
heroku buildpacks:clear -a mfe-enterprise-dashboard
heroku buildpacks:add -i 1 heroku/java -a mfe-enterprise-dashboard
heroku buildpacks:add -i 2 heroku/nodejs -a mfe-enterprise-dashboard
```

This repo includes a root `pom.xml` aggregator so the Java buildpack can detect the app correctly.

## 4) Set required config vars

Set at least:

```bash
heroku config:set APP_JWT_SECRET="replace-with-strong-secret" -a mfe-enterprise-dashboard
heroku config:set APP_CORS_ALLOWED_ORIGINS="https://mfe-enterprise-dashboard.herokuapp.com" -a mfe-enterprise-dashboard
```

For true single-app mode, remote URLs should be same-origin paths (or disabled if not used):

```bash
heroku config:set ACCOUNTS_STABLE_URL="https://mfe-enterprise-dashboard.herokuapp.com/assets/remoteEntry.js" -a mfe-enterprise-dashboard
heroku config:set ACCOUNTS_CANARY_URL="https://mfe-enterprise-dashboard.herokuapp.com/assets/remoteEntry.js" -a mfe-enterprise-dashboard
heroku config:set BILLING_STABLE_URL="https://mfe-enterprise-dashboard.herokuapp.com/assets/remoteEntry.js" -a mfe-enterprise-dashboard
heroku config:set BILLING_CANARY_URL="https://mfe-enterprise-dashboard.herokuapp.com/assets/remoteEntry.js" -a mfe-enterprise-dashboard
heroku config:set ANALYTICS_STABLE_URL="https://mfe-enterprise-dashboard.herokuapp.com/assets/remoteEntry.js" -a mfe-enterprise-dashboard
heroku config:set ANALYTICS_CANARY_URL="https://mfe-enterprise-dashboard.herokuapp.com/assets/remoteEntry.js" -a mfe-enterprise-dashboard
```

## 5) Deploy

Push main branch to one app:

```bash
git push heroku main
```

Heroku build pipeline at root uses:

- `heroku-postbuild` -> `build:frontend` -> `build:remotes` -> `copy:frontend` -> `copy:remotes` -> `build:backend`
- `Procfile` web process -> starts Spring Boot jar only

`build:backend` uses Maven Wrapper at `services/app-registry/mvnw`, so it does not require `mvn` on PATH.

## 6) Validate

- Open app URL.
- Login (`admin` gets `ADMIN + USER`, other usernames get `USER`).
- Confirm `/api/registry` is served by backend.
- Confirm SPA routes (for example `/accounts` or `/debug/remotes`) refresh without 404.

## Notes

- Production runtime does not use Vite dev server.
- Spring Boot serves frontend assets from `services/app-registry/src/main/resources/static`.
- Registry default remote URLs are same-origin (`/remotes/.../assets/remoteEntry.js`) for single-app deployment.
