# Install Native Messaging Host
# Usage: pwsh native-host/install.ps1 [ExtensionId]
# If no ExtensionId provided, prompts interactively.

param(
    [string]$ExtensionId
)

$ErrorActionPreference = "Stop"

function Write-Info { param($msg) Write-Host "[INFO] $msg" -ForegroundColor Cyan }
function Write-Success { param($msg) Write-Host "[SUCCESS] $msg" -ForegroundColor Green }
function Write-ErrorMsg { param($msg) Write-Host "[ERROR] $msg" -ForegroundColor Red }

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$HostName = "com.popemkt.bridge"
$DataDir = Join-Path $HOME ".popemkt" "browser-extension"

# --- Browser detection ---

function Get-Browsers {
    $browsers = @()
    if ($IsMacOS) {
        $defs = @(
            @{ Name = "Google Chrome";       App = "/Applications/Google Chrome.app";          NMH = Join-Path $HOME "Library/Application Support/Google/Chrome/NativeMessagingHosts" }
            @{ Name = "Google Chrome Beta";  App = "/Applications/Google Chrome Beta.app";     NMH = Join-Path $HOME "Library/Application Support/Google/Chrome Beta/NativeMessagingHosts" }
            @{ Name = "Google Chrome Dev";   App = "/Applications/Google Chrome Dev.app";      NMH = Join-Path $HOME "Library/Application Support/Google/Chrome Dev/NativeMessagingHosts" }
            @{ Name = "Google Chrome Canary";App = "/Applications/Google Chrome Canary.app";   NMH = Join-Path $HOME "Library/Application Support/Google/Chrome Canary/NativeMessagingHosts" }
            @{ Name = "Chromium";            App = "/Applications/Chromium.app";               NMH = Join-Path $HOME "Library/Application Support/Chromium/NativeMessagingHosts" }
            @{ Name = "Brave Browser";       App = "/Applications/Brave Browser.app";          NMH = Join-Path $HOME "Library/Application Support/BraveSoftware/Brave-Browser/NativeMessagingHosts" }
            @{ Name = "Microsoft Edge";      App = "/Applications/Microsoft Edge.app";         NMH = Join-Path $HOME "Library/Application Support/Microsoft Edge/NativeMessagingHosts" }
            @{ Name = "Arc";                 App = "/Applications/Arc.app";                    NMH = Join-Path $HOME "Library/Application Support/Arc/User Data/NativeMessagingHosts" }
        )
        foreach ($d in $defs) { if (Test-Path $d.App) { $browsers += [PSCustomObject]@{ Name = $d.Name; AppPath = $d.App; NMHDir = $d.NMH } } }
    } elseif ($IsLinux) {
        $defs = @(
            @{ Name = "Google Chrome";       Cmd = "google-chrome-stable"; NMH = Join-Path $HOME ".config/google-chrome/NativeMessagingHosts" }
            @{ Name = "Google Chrome Beta";  Cmd = "google-chrome-beta";   NMH = Join-Path $HOME ".config/google-chrome-beta/NativeMessagingHosts" }
            @{ Name = "Chromium";            Cmd = "chromium-browser";     NMH = Join-Path $HOME ".config/chromium/NativeMessagingHosts" }
            @{ Name = "Brave Browser";       Cmd = "brave-browser";        NMH = Join-Path $HOME ".config/BraveSoftware/Brave-Browser/NativeMessagingHosts" }
            @{ Name = "Microsoft Edge";      Cmd = "microsoft-edge";       NMH = Join-Path $HOME ".config/microsoft-edge/NativeMessagingHosts" }
        )
        foreach ($d in $defs) { if (Get-Command $d.Cmd -ErrorAction SilentlyContinue) { $browsers += [PSCustomObject]@{ Name = $d.Name; AppPath = $d.Cmd; NMHDir = $d.NMH } } }
    } elseif ($IsWindows) {
        $defs = @(
            @{ Name = "Google Chrome";       Reg = "HKCU:\Software\Google\Chrome"; NMH = "Google\Chrome" }
            @{ Name = "Google Chrome Beta";  Reg = "HKCU:\Software\Google\Chrome Beta"; NMH = "Google\Chrome Beta" }
            @{ Name = "Chromium";            Reg = "HKCU:\Software\Chromium";      NMH = "Chromium" }
            @{ Name = "Brave Browser";       Reg = "HKCU:\Software\BraveSoftware\Brave-Browser"; NMH = "BraveSoftware\Brave-Browser" }
            @{ Name = "Microsoft Edge";      Reg = "HKCU:\Software\Microsoft\Edge"; NMH = "Microsoft\Edge" }
        )
        foreach ($d in $defs) { if (Test-Path $d.Reg -ErrorAction SilentlyContinue) { $browsers += [PSCustomObject]@{ Name = $d.Name; AppPath = $d.Reg; NMHDir = $d.NMH } } }
    }
    return $browsers
}

# --- Generate launcher ---

function New-BridgeLauncher {
    $NodePath = (Get-Command "node").Source
    if ($IsWindows) {
        $LauncherPath = Join-Path $ScriptDir "bridge.bat"
        [System.IO.File]::WriteAllText($LauncherPath, "@echo off`r`n`"$NodePath`" `"%~dp0bridge.ts`" %*")
    } else {
        $LauncherPath = Join-Path $ScriptDir "bridge"
        [System.IO.File]::WriteAllText($LauncherPath, "#!/bin/bash`nexec `"$NodePath`" `"$(Split-Path -Parent $LauncherPath)/bridge.ts`" `"`$@`"")
        chmod +x $LauncherPath
    }
    return $LauncherPath
}

# --- Main ---

if (-not (Get-Command "node" -ErrorAction SilentlyContinue)) { Write-ErrorMsg "Node.js is required."; exit 1 }

# Detect browser
$Browsers = Get-Browsers
if ($Browsers.Count -eq 0) { Write-ErrorMsg "No Chromium-based browsers found."; exit 1 }

if ($Browsers.Count -eq 1) {
    $SelectedBrowser = $Browsers[0]
    Write-Info "Found: $($SelectedBrowser.Name)"
} else {
    Write-Host ""
    for ($i = 0; $i -lt $Browsers.Count; $i++) { Write-Host "  [$($i + 1)] $($Browsers[$i].Name)" -ForegroundColor White }
    Write-Host ""
    $choice = Read-Host "Select a browser (1-$($Browsers.Count))"
    $idx = [int]$choice - 1
    if ($idx -lt 0 -or $idx -ge $Browsers.Count) { Write-ErrorMsg "Invalid selection."; exit 1 }
    $SelectedBrowser = $Browsers[$idx]
}

# Get extension ID
if ([string]::IsNullOrWhiteSpace($ExtensionId)) {
    try {
        if ($IsMacOS) { & open -a $SelectedBrowser.Name "chrome://extensions/" 2>$null }
        elseif ($IsLinux) { & $SelectedBrowser.AppPath "chrome://extensions/" 2>$null & }
    } catch {}
    Write-Host ""
    Write-Host "  Load the extension in $($SelectedBrowser.Name):" -ForegroundColor White
    Write-Host "  1. Enable 'Developer mode'" -ForegroundColor White
    Write-Host "  2. Click 'Load unpacked' -> select dist/ folder" -ForegroundColor White
    Write-Host ""
    $ExtensionId = Read-Host "Paste the Extension ID"
    if ([string]::IsNullOrWhiteSpace($ExtensionId)) { Write-ErrorMsg "No extension ID."; exit 1 }
}
$ExtensionId = $ExtensionId.Trim()

# Generate launcher and manifest
$LauncherPath = New-BridgeLauncher
Write-Info "Launcher: $LauncherPath"

$Manifest = @{
    name = $HostName
    description = "Browser Extension - Native Messaging Bridge"
    path = $LauncherPath
    type = "stdio"
    allowed_origins = @("chrome-extension://$ExtensionId/")
} | ConvertTo-Json -Depth 3

if ($IsWindows) {
    $ManifestDir = Join-Path $env:LOCALAPPDATA "PopeMkt" "NativeMessagingHosts"
    New-Item -Path $ManifestDir -ItemType Directory -Force | Out-Null
    $ManifestPath = Join-Path $ManifestDir "$HostName.json"
    $Manifest | Out-File -FilePath $ManifestPath -Encoding utf8 -Force
    $RegPath = "HKCU:\Software\$($SelectedBrowser.NMHDir)\NativeMessagingHosts\$HostName"
    New-Item -Path $RegPath -Force | Out-Null
    Set-ItemProperty -Path $RegPath -Name "(Default)" -Value $ManifestPath
} else {
    $NMHDir = $SelectedBrowser.NMHDir
    New-Item -Path $NMHDir -ItemType Directory -Force | Out-Null
    $ManifestPath = Join-Path $NMHDir "$HostName.json"
    $Manifest | Out-File -FilePath $ManifestPath -Encoding utf8 -Force
}

New-Item -Path $DataDir -ItemType Directory -Force | Out-Null

Write-Success "Native messaging host installed for $($SelectedBrowser.Name)"
Write-Info "Restart the browser, then: curl http://127.0.0.1:19816/health"
