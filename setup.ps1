# Full Setup
# Usage: pwsh setup.ps1

$ErrorActionPreference = "Stop"
$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "`nBrowser Extension Setup" -ForegroundColor Magenta
Write-Host "========================`n" -ForegroundColor DarkGray

# Step 1: Build
Write-Host "[1/3] Installing dependencies and building..." -ForegroundColor Yellow
Push-Location $ProjectDir
pnpm install --frozen-lockfile
pnpm build
Pop-Location
Write-Host "[SUCCESS] Extension built.`n" -ForegroundColor Green

# Step 2: Install Raycast extension
Write-Host "[2/3] Installing Raycast extension..." -ForegroundColor Yellow
pwsh (Join-Path $ProjectDir "raycast-extension" "install.ps1")
Write-Host ""

# Step 3: Done
Write-Host "[3/3] Setup complete!" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Next:" -ForegroundColor White
Write-Host "  1. Load the extension in your browser (dist/ folder)" -ForegroundColor White
Write-Host "  2. Start the bridge:  pnpm bridge" -ForegroundColor Green
Write-Host "  3. Or start everything: pnpm dev:all" -ForegroundColor Green
Write-Host "  4. Verify: curl http://127.0.0.1:19816/health" -ForegroundColor Green
Write-Host ""
