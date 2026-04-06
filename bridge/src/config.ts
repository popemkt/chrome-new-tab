import path from 'node:path';
import os from 'node:os';
import { BRIDGE_PORT, DATA_DIR_NAME, COMMANDS_FILENAME, CDP_PORT } from '@extension/protocol';

export { BRIDGE_PORT, CDP_PORT };
export const PROJECT_ROOT = path.resolve(import.meta.dirname, '..', '..');
export const DATA_DIR = path.join(os.homedir(), DATA_DIR_NAME);
export const COMMANDS_FILE = path.join(DATA_DIR, COMMANDS_FILENAME);
export const LOG_FILE = path.join(DATA_DIR, 'bridge.log');
export const PID_FILE = path.join(DATA_DIR, 'bridge.pid');
