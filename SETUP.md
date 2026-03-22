# Setup Guide

## Full Setup (everything)

```bash
pnpm setup
```

Builds the extension, installs the native messaging bridge, and sets up the Raycast extension.

## Individual Scripts

| Command | What it does |
|---|---|
| `pnpm build` | Build the Chrome extension to `dist/` |
| `pnpm setup:native-host` | Install native messaging bridge (interactive) |
| `pnpm setup:raycast` | Install Raycast extension dependencies |

Each can also be run directly:

```powershell
pwsh native-host/install.ps1              # interactive
pwsh native-host/install.ps1 <ext-id>     # non-interactive
pwsh raycast-extension/install.ps1
```

## Verify

After restarting the browser:

```bash
curl http://127.0.0.1:19816/health
curl http://127.0.0.1:19816/commands
```

## Raycast

```bash
cd raycast-extension && npm run dev
```

Open Raycast and search **"Run Browser Extension Command"**.

## Architecture

```
Chrome Extension ←→ (native messaging) ←→ bridge.ts ←→ HTTP :19816 ←→ Raycast
                                             |
                                        commands.json (cache)
```

### HTTP Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Bridge status, Chrome connection, uptime |
| `/commands` | GET | Current command list |
| `/execute` | POST | Execute a command (`{"commandId": "..."}`) |

## Adding Commands

Edit `packages/storage/lib/impl/commandRegistry.ts`. Commands appear in:
- The in-page command palette (Cmd+Shift+P / Ctrl+Shift+P)
- Raycast (after browser restart or extension reload)
