import { showToast, Toast } from '@raycast/api';
import { BRIDGE_HTTP_URL } from '@extension/protocol';

export async function reloadExtension(toast?: Toast): Promise<boolean> {
  if (!toast) toast = await showToast({ style: Toast.Style.Animated, title: 'Reloading...' });
  toast.style = Toast.Style.Animated;
  toast.title = 'Reloading extension...';
  toast.message = 'via CDP';
  try {
    const res = await fetch(`${BRIDGE_HTTP_URL}/reload-extension`, { method: 'POST' });
    const data = (await res.json()) as { error?: string; method?: string };
    if (!res.ok) {
      toast.style = Toast.Style.Failure;
      toast.title = 'Reload failed';
      toast.message = data.error || `HTTP ${res.status}`;
      return false;
    }
    toast.style = Toast.Style.Success;
    toast.title = 'Extension reloaded';
    toast.message = data.method === 'websocket-fallback' ? 'via WebSocket (CDP unavailable)' : 'via CDP';
    return true;
  } catch {
    toast.style = Toast.Style.Failure;
    toast.title = 'Bridge not reachable';
    toast.message = 'Make sure the bridge is running.';
    return false;
  }
}

export default async function command() {
  await reloadExtension();
}
