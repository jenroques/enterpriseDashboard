$ErrorActionPreference = 'Stop'

$repoRoot = Resolve-Path "$PSScriptRoot/../.."
$repoPath = $repoRoot.Path

Write-Host "Starting MFE frontend apps (shell + remotes)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$repoPath'; npm run dev" -WindowStyle Normal

Write-Host "Starting Spring Boot app-registry..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$repoPath/services/app-registry'; mvn spring-boot:run" -WindowStyle Normal

Write-Host "Local environment starting in separate terminals:"
Write-Host "- Frontends: http://localhost:5173"
Write-Host "- Registry:  http://localhost:8081/api/registry"
