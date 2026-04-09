import { WebSocket } from 'ws';
import type { BridgeUpMessage } from '@extension/protocol';
import { log } from './logger.ts';
import { ctx, setExtensionSocket, sendToChrome, resolvePendingRequest, syncCommands } from './state.ts';

export function handleConnection(ws: WebSocket) {
  // Single-client policy: close existing connection before accepting the new one
  if (ctx.extension.connected) {
    log('Closing existing Chrome connection (replaced by new client)');
    ctx.extension.socket!.close(1000, 'Replaced by new connection');
  }

  log('Chrome extension connected via WebSocket');
  setExtensionSocket(ws);

  ws.on('message', (data: Buffer) => {
    handleMessage(data.toString('utf8'));
  });

  ws.on('close', () => {
    log('Chrome extension disconnected');
    if (ctx.extension.socket === ws) {
      setExtensionSocket(null);
    }
  });

  ws.on('error', err => {
    log(`WebSocket error: ${err.message}`);
  });
}

function handleMessage(raw: string) {
  let msg: BridgeUpMessage;
  try {
    msg = JSON.parse(raw);
  } catch {
    log(`Invalid JSON from Chrome: ${raw.slice(0, 100)}`);
    return;
  }

  log(`WS received: ${msg.type}`);

  switch (msg.type) {
    case 'SYNC_COMMANDS':
      syncCommands(msg.commands, msg.extensionId);
      sendToChrome({ type: 'SYNC_ACK', count: msg.commands.length });
      break;

    case 'RESPONSE':
      resolvePendingRequest(msg.requestId, msg.data);
      break;

    case 'PING':
      sendToChrome({ type: 'PONG' });
      break;

    case 'COMMAND_RESULT':
      log('Command result received');
      break;
  }
}
