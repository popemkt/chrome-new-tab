# Setup Guide

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
| `pnpm dev:all` | Start bridge server + Raycast dev mode |
| `pnpm dev:bridge` | Start bridge server only |
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
Chrome Extension <--> (WebSocket :19816) <--> bridge.ts <--> HTTP :19816 <--> Raycast
                                                  |
                                             commands.json (cache)
```

### HTTP Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Bridge status, Chrome connection, uptime |
| `/commands` | GET | Current command list |
| `/execute` | POST | Execute a command (`{"commandId": "..."}`) |
| `/search-bookmarks` | GET | Search bookmarks (`?q=query`) |

### WebSocket Protocol

The Chrome extension connects to `ws://127.0.0.1:19816` and exchanges JSON messages. The bridge relays HTTP requests to Chrome via WebSocket and returns responses.

## Adding Commands

Edit `packages/storage/lib/impl/commandRegistry.ts`. Commands appear in:
- The in-page command palette (Ctrl+Shift+P)
- Raycast (after extension reload)
