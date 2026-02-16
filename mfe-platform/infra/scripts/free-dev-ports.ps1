$ErrorActionPreference = 'Stop'

$ports = @(5173, 5174, 5175, 5176, 8081)

$listeners = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
  Where-Object { $ports -contains $_.LocalPort }

if (-not $listeners) {
  Write-Host "[dev-ports] No conflicting listeners found on ports: $($ports -join ', ')"
  exit 0
}

$pids = $listeners |
  Select-Object -ExpandProperty OwningProcess -Unique |
  Where-Object { $_ -and $_ -ne $PID }

if (-not $pids) {
  Write-Host "[dev-ports] No external conflicting processes found."
  exit 0
}

Write-Host "[dev-ports] Stopping processes using dev ports: $($pids -join ', ')"

foreach ($procId in $pids) {
  try {
    Stop-Process -Id $procId -Force -ErrorAction Stop
  }
  catch {
    Write-Host "[dev-ports] Skipped PID ${procId}: $($_.Exception.Message)"
  }
}

Write-Host "[dev-ports] Ports are ready."
