# Full Setup
# Usage: pwsh setup.ps1

$ErrorActionPreference = "Stop"
$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "`nBrowser Extension Setup" -ForegroundColor Magenta
Write-Host "========================`n" -ForegroundColor DarkGray

# Step 1: Build
Write-Host "[1/4] Installing dependencies and building..." -ForegroundColor Yellow
Push-Location $ProjectDir
pnpm install --frozen-lockfile
pnpm build
Pop-Location
Write-Host "[SUCCESS] Extension built.`n" -ForegroundColor Green

# Step 2: Install Raycast extension
Write-Host "[2/4] Installing Raycast extension..." -ForegroundColor Yellow
pwsh (Join-Path $ProjectDir "raycast-extension" "install.ps1")
Write-Host ""

# Step 3: Add --remote-debugging-port=9222 to Edge shortcuts
Write-Host "[3/4] Configuring Edge for remote debugging (CDP)..." -ForegroundColor Yellow
$flag = "--remote-debugging-port=9222"
$shell = New-Object -ComObject WScript.Shell
$shortcuts = @(
    "$env:APPDATA\Microsoft\Internet Explorer\Quick Launch\Microsoft Edge.lnk",
    "$env:APPDATA\Microsoft\Internet Explorer\Quick Launch\User Pinned\TaskBar\Microsoft Edge.lnk"
)
$updated = 0
foreach ($p in $shortcuts) {
    if (Test-Path $p) {
        $lnk = $shell.CreateShortcut($p)
        if ($lnk.Arguments -notlike "*$flag*") {
            if ($lnk.Arguments) {
                $lnk.Arguments = "$($lnk.Arguments) $flag"
            } else {
                $lnk.Arguments = $flag
            }
            $lnk.Save()
            $updated++
            Write-Host "  Updated: $p" -ForegroundColor Gray
        } else {
            Write-Host "  Already set: $p" -ForegroundColor Gray
        }
    }
}
if ($updated -gt 0) {
    Write-Host "[SUCCESS] Edge shortcuts updated. Restart Edge for CDP to take effect.`n" -ForegroundColor Green
} else {
    Write-Host "[OK] Edge shortcuts already configured.`n" -ForegroundColor Green
}

# Step 4: Done
Write-Host "[4/4] Setup complete!" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Next:" -ForegroundColor White
Write-Host "  1. Restart Edge (for CDP flag to take effect)" -ForegroundColor White
Write-Host "  2. Load the extension in Edge (edge://extensions -> Load unpacked -> dist/)" -ForegroundColor White
Write-Host "  3. Start the bridge:  pnpm bridge" -ForegroundColor Green
Write-Host "  4. Or start everything: pnpm dev:all" -ForegroundColor Green
Write-Host "  5. Verify: curl http://127.0.0.1:19816/health" -ForegroundColor Green
Write-Host ""
