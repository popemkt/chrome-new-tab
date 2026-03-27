# Install Raycast Extension Dependencies
# Usage: pwsh raycast-extension/install.ps1

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

if (-not (Get-Command "pnpm" -ErrorAction SilentlyContinue)) {
    Write-Host "[ERROR] pnpm is required." -ForegroundColor Red
    exit 1
}

Push-Location $ScriptDir
pnpm install
Pop-Location

Write-Host "[SUCCESS] Raycast extension ready." -ForegroundColor Green
Write-Host "[INFO] Start dev mode: cd raycast-extension && pnpm dev" -ForegroundColor Cyan
