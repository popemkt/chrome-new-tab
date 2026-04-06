import { WebSocket } from 'ws';
import type { BridgeUpMessage } from '@extension/protocol';
import { log } from './logger.ts';
import { setChromeSocket, sendToChrome, resolvePendingRequest, syncCommands } from './state.ts';

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
