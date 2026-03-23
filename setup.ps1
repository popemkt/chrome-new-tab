# Full Setup — composes all individual install scripts
# Usage: pwsh setup.ps1

$ErrorActionPreference = "Stop"
$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "`nBrowser Extension Setup" -ForegroundColor Magenta
Write-Host "========================`n" -ForegroundColor DarkGray

# Step 1: Build
Write-Host "[1/4] Building extension..." -ForegroundColor Yellow
Push-Location $ProjectDir
pnpm install --frozen-lockfile
pnpm build
Pop-Location
Write-Host "[SUCCESS] Extension built.`n" -ForegroundColor Green

# Step 2: Install native messaging host (interactive — prompts for browser + extension ID)
Write-Host "[2/4] Installing native messaging bridge..." -ForegroundColor Yellow
pwsh (Join-Path $ProjectDir "native-host" "install.ps1")
Write-Host ""

# Step 3: Install Raycast extension
Write-Host "[3/4] Installing Raycast extension..." -ForegroundColor Yellow
pwsh (Join-Path $ProjectDir "raycast-extension" "install.ps1")
Write-Host ""

# Step 4: Done
Write-Host "[4/4] Setup complete!" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Next:" -ForegroundColor White
Write-Host "  1. Restart your browser" -ForegroundColor White
Write-Host "  2. Verify:  curl http://127.0.0.1:19816/health" -ForegroundColor Green
Write-Host "  3. Raycast: cd raycast-extension && npm run dev" -ForegroundColor Green
Write-Host ""
