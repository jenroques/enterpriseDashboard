# Heroku Deployment Guide

This monorepo is deployed to Heroku as **multiple apps**:

- 1 x registry API (`services/app-registry`)
- 1 x shell host (`apps/shell-host`)
- 3 x remotes (`apps/remote-accounts`, `apps/remote-billing`, `apps/remote-analytics`)

## 1) Prerequisites

- Heroku CLI authenticated (`heroku login`)
- Git repo connected to Heroku
- Heroku stack supports Node + Java buildpacks (default Heroku-22 works)

## 2) Create Heroku apps

Example names (replace as needed):

- `mfe-registry-prod`
- `mfe-shell-prod`
- `mfe-accounts-prod`
- `mfe-billing-prod`
- `mfe-analytics-prod`

## Optional: app.json manifests

Each deployable sub-app now includes an `app.json` manifest:

- `apps/shell-host/app.json`
- `apps/remote-accounts/app.json`
- `apps/remote-billing/app.json`
- `apps/remote-analytics/app.json`
- `services/app-registry/app.json`

These manifests define expected buildpacks and env vars for each app, and can be used as a checklist when configuring Heroku apps.

## 3) Configure monorepo subdirectory builds

For each app, configure the subdir buildpack first, then language buildpack.

### Shell and remotes (Node buildpack)

```bash
heroku buildpacks:clear -a mfe-shell-prod
heroku buildpacks:add -i 1 https://github.com/timanovsky/subdir-heroku-buildpack -a mfe-shell-prod
heroku buildpacks:add -i 2 heroku/nodejs -a mfe-shell-prod
heroku config:set APP_BASE=apps/shell-host -a mfe-shell-prod
```

Repeat for each remote with matching `APP_BASE`:

- accounts: `APP_BASE=apps/remote-accounts`
- billing: `APP_BASE=apps/remote-billing`
- analytics: `APP_BASE=apps/remote-analytics`

### Registry (Java buildpack)

```bash
heroku buildpacks:clear -a mfe-registry-prod
heroku buildpacks:add -i 1 https://github.com/timanovsky/subdir-heroku-buildpack -a mfe-registry-prod
heroku buildpacks:add -i 2 heroku/java -a mfe-registry-prod
heroku config:set APP_BASE=services/app-registry -a mfe-registry-prod
```

## 4) Set required config vars

## Registry app config (`mfe-registry-prod`)

```bash
heroku config:set APP_JWT_SECRET="replace-with-strong-secret" -a mfe-registry-prod
heroku config:set APP_CORS_ALLOWED_ORIGINS="https://mfe-shell-prod.herokuapp.com" -a mfe-registry-prod

heroku config:set ACCOUNTS_STABLE_URL="https://mfe-accounts-prod.herokuapp.com/assets/remoteEntry.js" -a mfe-registry-prod
heroku config:set ACCOUNTS_CANARY_URL="https://mfe-accounts-prod.herokuapp.com/assets/remoteEntry.js" -a mfe-registry-prod

heroku config:set BILLING_STABLE_URL="https://mfe-billing-prod.herokuapp.com/assets/remoteEntry.js" -a mfe-registry-prod
heroku config:set BILLING_CANARY_URL="https://mfe-billing-prod.herokuapp.com/assets/remoteEntry.js" -a mfe-registry-prod

heroku config:set ANALYTICS_STABLE_URL="https://mfe-analytics-prod.herokuapp.com/assets/remoteEntry.js" -a mfe-registry-prod
heroku config:set ANALYTICS_CANARY_URL="https://mfe-analytics-prod.herokuapp.com/assets/remoteEntry.js" -a mfe-registry-prod
```

### Shell app config (`mfe-shell-prod`)

```bash
heroku config:set VITE_API_BASE_URL="https://mfe-registry-prod.herokuapp.com/api" -a mfe-shell-prod
```

Remotes do not require extra config vars for default behavior.

### Optional: one-command PowerShell helper

Instead of setting vars manually, use:

```powershell
./infra/scripts/set-heroku-config.ps1 `
	-ShellApp mfe-shell-prod `
	-RegistryApp mfe-registry-prod `
	-ShellOrigin https://mfe-shell-prod.herokuapp.com `
	-RegistryOrigin https://mfe-registry-prod.herokuapp.com `
	-AccountsOrigin https://mfe-accounts-prod.herokuapp.com `
	-BillingOrigin https://mfe-billing-prod.herokuapp.com `
	-AnalyticsOrigin https://mfe-analytics-prod.herokuapp.com
```

Optional: pass your own JWT secret with `-JwtSecret "..."`.

## 5) Deploy

Push the same git branch to each app:

```bash
git push heroku main
```

If using multiple Heroku remotes:

```bash
git push heroku-shell main
git push heroku-accounts main
git push heroku-billing main
git push heroku-analytics main
git push heroku-registry main
```

## 6) Validate

- Open shell app URL.
- Login (`admin` gets `ADMIN + USER`, other usernames get `USER`).
- Confirm left nav includes Accounts, Billing, Analytics.
- Open `/debug/remotes` in shell and verify remotes load from Heroku URLs.

## Notes

- Frontend apps use `vite preview` and bind to `0.0.0.0:$PORT` for Heroku runtime.
- Registry reads Heroku `PORT` automatically.
- If config vars change, redeploy the shell so `VITE_API_BASE_URL` is baked into the frontend build.
