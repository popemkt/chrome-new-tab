import path from 'node:path';
import os from 'node:os';

export const PORT = 19816;
export const DATA_DIR = path.join(os.homedir(), '.popemkt', 'browser-extension');
export const COMMANDS_FILE = path.join(DATA_DIR, 'commands.json');
export const LOG_FILE = path.join(DATA_DIR, 'bridge.log');
export const PID_FILE = path.join(DATA_DIR, 'bridge.pid');
