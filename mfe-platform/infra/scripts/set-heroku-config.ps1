param(
  [Parameter(Mandatory = $true)]
  [string]$ShellApp,

  [Parameter(Mandatory = $true)]
  [string]$RegistryApp,

  [Parameter(Mandatory = $true)]
  [string]$ShellOrigin,

  [Parameter(Mandatory = $true)]
  [string]$RegistryOrigin,

  [Parameter(Mandatory = $true)]
  [string]$AccountsOrigin,

  [Parameter(Mandatory = $true)]
  [string]$BillingOrigin,

  [Parameter(Mandatory = $true)]
  [string]$AnalyticsOrigin,

  [string]$JwtSecret
)

$ErrorActionPreference = 'Stop'

function Set-HerokuConfig {
  param(
    [Parameter(Mandatory = $true)]
    [string]$App,

    [Parameter(Mandatory = $true)]
    [hashtable]$Values
  )

  foreach ($key in $Values.Keys) {
    $value = [string]$Values[$key]
    Write-Host "Setting $key on $App"
    & heroku config:set "$key=$value" -a $App | Out-Host
  }
}

if (-not (Get-Command heroku -ErrorAction SilentlyContinue)) {
  throw 'Heroku CLI is not installed or not on PATH. Install it from https://devcenter.heroku.com/articles/heroku-cli'
}

$shellOriginNormalized = $ShellOrigin.Trim().TrimEnd('/')
$registryOriginNormalized = $RegistryOrigin.Trim().TrimEnd('/')
$accountsOriginNormalized = $AccountsOrigin.Trim().TrimEnd('/')
$billingOriginNormalized = $BillingOrigin.Trim().TrimEnd('/')
$analyticsOriginNormalized = $AnalyticsOrigin.Trim().TrimEnd('/')

$accountsRemoteEntry = "$accountsOriginNormalized/assets/remoteEntry.js"
$billingRemoteEntry = "$billingOriginNormalized/assets/remoteEntry.js"
$analyticsRemoteEntry = "$analyticsOriginNormalized/assets/remoteEntry.js"

if ([string]::IsNullOrWhiteSpace($JwtSecret)) {
  $JwtSecret = [Guid]::NewGuid().ToString('N') + [Guid]::NewGuid().ToString('N')
  Write-Host 'APP_JWT_SECRET not supplied. Generated a random secret for this run.'
}

Set-HerokuConfig -App $ShellApp -Values @{
  VITE_API_BASE_URL = "$registryOriginNormalized/api"
}

Set-HerokuConfig -App $RegistryApp -Values @{
  APP_JWT_SECRET       = $JwtSecret
  APP_CORS_ALLOWED_ORIGINS = $shellOriginNormalized
  ACCOUNTS_STABLE_URL  = $accountsRemoteEntry
  ACCOUNTS_CANARY_URL  = $accountsRemoteEntry
  BILLING_STABLE_URL   = $billingRemoteEntry
  BILLING_CANARY_URL   = $billingRemoteEntry
  ANALYTICS_STABLE_URL = $analyticsRemoteEntry
  ANALYTICS_CANARY_URL = $analyticsRemoteEntry
}

Write-Host ''
Write-Host 'Heroku config update complete.'
Write-Host "- Shell app:    $ShellApp"
Write-Host "- Registry app: $RegistryApp"
Write-Host ''
Write-Host 'If VITE_API_BASE_URL changed, trigger a shell redeploy so the frontend rebuild includes the new value.'
