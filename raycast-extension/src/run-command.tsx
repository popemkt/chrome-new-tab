import { ActionPanel, Action, List, showToast, Toast, Icon, launchCommand, LaunchType } from '@raycast/api';
import { useEffect, useState } from 'react';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { BRIDGE_HTTP_URL, DATA_DIR_NAME, COMMANDS_FILENAME, type CommandDef } from '@extension/protocol';

const COMMANDS_FILE = join(homedir(), DATA_DIR_NAME, COMMANDS_FILENAME);

/** Map of command IDs that have dedicated static Raycast commands */
const STATIC_COMMANDS: Record<string, string> = {
  'open-options': 'open-options',
  'search-bookmarks': 'search-bookmarks',
};

interface FetchResult {
  commands: CommandDef[];
  syncedAt: string | null;
  chromeConnected: boolean;
  bridgeOnline: boolean;
  error: string | null;
}

async function fetchCommands(): Promise<FetchResult> {
  // Try HTTP first
  try {
    const res = await fetch(`${BRIDGE_HTTP_URL}/commands`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { commands?: CommandDef[]; syncedAt?: string; chromeConnected?: boolean };
    return {
      commands: data.commands ?? [],
      syncedAt: data.syncedAt ?? null,
      chromeConnected: data.chromeConnected ?? false,
      bridgeOnline: true,
      error: null,
    };
  } catch {
    // Bridge not running — fall back to cached file
    try {
      if (existsSync(COMMANDS_FILE)) {
        const data = JSON.parse(readFileSync(COMMANDS_FILE, 'utf8'));
        return {
          commands: (data.commands ?? []) as CommandDef[],
          syncedAt: data.syncedAt ?? null,
          chromeConnected: false,
          bridgeOnline: false,
          error: null,
        };
      }
    } catch {
      /* corrupt cache */
    }

    return {
      commands: [],
      syncedAt: null,
      chromeConnected: false,
      bridgeOnline: false,
      error: 'Bridge is not running and no cached commands found. Open Chrome with the extension installed.',
    };
  }
}

async function runCommand(commandId: string) {
  const staticName = STATIC_COMMANDS[commandId];
  if (staticName) {
    await launchCommand({ name: staticName, type: LaunchType.UserInitiated });
    return;
  }

  try {
    const res = await fetch(`${BRIDGE_HTTP_URL}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commandId }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      showToast({ style: Toast.Style.Failure, title: 'Command failed', message: data.error || `HTTP ${res.status}` });
      return;
    }
    showToast({ style: Toast.Style.Success, title: 'Command sent' });
  } catch {
    showToast({
      style: Toast.Style.Failure,
      title: 'Bridge not reachable',
      message: 'Make sure Chrome is open with the extension installed.',
    });
  }
}

function getCommandIcon(id: string): Icon {
  switch (id) {
    case 'open-options':
      return Icon.Gear;
    case 'toggle-theme':
      return Icon.Moon;
    default:
      return Icon.Terminal;
  }
}

function getStatusSubtitle(
  bridgeOnline: boolean,
  chromeConnected: boolean,
  syncedAt: string | null,
): string | undefined {
  if (bridgeOnline && chromeConnected) return 'Live';
  if (bridgeOnline) return 'Bridge online, Chrome disconnected';
  if (syncedAt) return `Cached (${new Date(syncedAt).toLocaleString()})`;
  return undefined;
}

export default function RunCommand() {
  const [commands, setCommands] = useState<CommandDef[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [bridgeOnline, setBridgeOnline] = useState(false);
  const [chromeConnected, setChromeConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCommands().then(result => {
      setCommands(result.commands);
      setSyncedAt(result.syncedAt);
      setChromeConnected(result.chromeConnected);
      setBridgeOnline(result.bridgeOnline);
      setError(result.error);
      setIsLoading(false);
    });
  }, []);

  if (error && commands.length === 0) {
    return (
      <List>
        <List.EmptyView title="Not Connected" description={error} icon={Icon.ExclamationMark} />
      </List>
    );
  }

  const staticCmds = commands.filter(c => c.id in STATIC_COMMANDS);
  const dynamicCmds = commands.filter(c => !(c.id in STATIC_COMMANDS));

  return (
    <List searchBarPlaceholder="Search commands..." isLoading={isLoading}>
      {staticCmds.length > 0 && (
        <List.Section title="Extension Commands">
          {staticCmds.map(cmd => (
            <List.Item
              key={cmd.id}
              icon={getCommandIcon(cmd.id)}
              title={cmd.label}
              subtitle={cmd.description}
              accessories={[{ tag: 'Static' }]}
              actions={
                <ActionPanel>
                  <Action title="Run Command" icon={Icon.Play} onAction={() => runCommand(cmd.id)} />
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      )}
      <List.Section title="Dynamic Commands" subtitle={getStatusSubtitle(bridgeOnline, chromeConnected, syncedAt)}>
        {dynamicCmds.map(cmd => (
          <List.Item
            key={cmd.id}
            icon={getCommandIcon(cmd.id)}
            title={cmd.label}
            subtitle={cmd.description}
            actions={
              <ActionPanel>
                <Action title="Run Command" icon={Icon.Play} onAction={() => runCommand(cmd.id)} />
              </ActionPanel>
            }
          />
        ))}
      </List.Section>
    </List>
  );
}
