# Setup Guide

## Prerequisites (manual, one-time)

### Edge: Enable remote debugging

The bridge uses Chrome DevTools Protocol (CDP) to reload the extension from disk.
Edge must be launched with the debugging flag for this to work.

**Automated:** Run `pnpm setup` — this updates your Edge shortcuts automatically.

**Manual:** Right-click your Edge shortcut → Properties → append to Target:
```
--remote-debugging-port=9222
```

Then **restart Edge** for the flag to take effect.

Verify it's working:
```bash
curl http://127.0.0.1:9222/json/version
```

### Load the extension in Edge

1. Build: `pnpm build`
2. Go to `edge://extensions` → enable Developer Mode
3. Click "Load unpacked" → select the `dist/` folder

## Full Setup (everything)

```bash
pnpm setup
```

Builds the extension and installs the Raycast extension.

## Individual Scripts

| Command | What it does |
|---|---|
| `pnpm build` | Build the Chrome extension to `dist/` |
| `pnpm bridge` | Start the WebSocket + HTTP bridge server |
| `pnpm dev:all` | Start bridge server + Raycast dev mode (with hot reload) |
| `pnpm dev:bridge` | Start bridge server only (with `--watch` hot reload) |
| `pnpm dev:raycast` | Start Raycast extension dev mode only |
| `pnpm setup:raycast` | Install Raycast extension dependencies |

## Development

Start the bridge and Raycast together:

```bash
pnpm dev:all
```

Or just the bridge:

```bash
pnpm bridge
```

### Dev workflow

Use Raycast commands for the full build/reload cycle:

| Raycast Command | What it does |
|---|---|
| **Dev: Build & Reload Extension** | Builds from source, then reloads in Edge via CDP |
| **Dev: Build Extension** | Builds from source only |
| **Dev: Reload Extension** | Reloads extension in Edge only (picks up new files from `dist/`) |

## Verify

```bash
curl http://127.0.0.1:19816/health
curl http://127.0.0.1:19816/commands
```

The extension icon shows `!` when the bridge is not connected.

## Raycast

```bash
cd raycast-extension && pnpm dev
```

Open Raycast and search **"Run Browser Extension Command"** or **"Search Bookmarks"**.

## Architecture

```
Chrome Extension <--> (WebSocket :19816) <--> Bridge <--> HTTP :19816 <--> Raycast
                                                |                |
                                           commands.json    CDP :9222 --> Edge
```

### HTTP Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Bridge status, Chrome connection, uptime |
| `/commands` | GET | Current command list |
| `/execute` | POST | Execute a command (`{"commandId": "..."}`) |
| `/search-bookmarks` | GET | Search bookmarks (`?q=query`) |
| `/reload-extension` | POST | Reload extension via CDP (falls back to WS) |
| `/dev/build` | POST | Build the extension from source |

### WebSocket Protocol

The Chrome extension connects to `ws://127.0.0.1:19816` and exchanges JSON messages. The bridge relays HTTP requests to Chrome via WebSocket and returns responses.

## Adding Commands

Edit `packages/storage/lib/impl/commandRegistry.ts`. Commands appear in:
- The in-page command palette (Ctrl+Shift+P)
- Raycast (after extension reload)
