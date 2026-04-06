import { WebSocket } from 'ws';
import { log } from './logger.ts';
import { setChromeSocket, sendToChrome, resolvePendingRequest, syncCommands, type CommandDef } from './state.ts';

export function handleConnection(ws: WebSocket) {
  log('Chrome extension connected via WebSocket');
  setChromeSocket(ws);

  ws.on('message', (data: Buffer) => {
    handleMessage(data.toString('utf8'));
  });

  ws.on('close', () => {
    log('Chrome extension disconnected');
    setChromeSocket(null);
  });

  ws.on('error', err => {
    log(`WebSocket error: ${err.message}`);
  });
}

function handleMessage(raw: string) {
  let msg: Record<string, unknown>;
  try {
    msg = JSON.parse(raw);
  } catch {
    log(`Invalid JSON from Chrome: ${raw.slice(0, 100)}`);
    return;
  }

  const type = msg.type as string;
  log(`WS received: ${type}`);

  switch (type) {
    case 'SYNC_COMMANDS':
      syncCommands((msg.commands as CommandDef[]) ?? [], (msg.extensionId as string) ?? null);
      sendToChrome({ type: 'SYNC_ACK', count: ((msg.commands as CommandDef[]) ?? []).length });
      break;

    case 'RESPONSE': {
      const requestId = msg.requestId as string | undefined;
      if (requestId) resolvePendingRequest(requestId, msg.data);
      break;
    }

    case 'PING':
      sendToChrome({ type: 'PONG' });
      break;

    case 'COMMAND_RESULT':
      log('Command result received');
      break;

    default:
      log(`Unknown message type: ${type}`);
  }
}
