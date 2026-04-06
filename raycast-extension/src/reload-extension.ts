import { showToast, Toast } from '@raycast/api';

const BRIDGE_URL = 'http://127.0.0.1:19816';

export default async function reloadExtension() {
  try {
    const res = await fetch(`${BRIDGE_URL}/reload-extension`, { method: 'POST' });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      showToast({ style: Toast.Style.Failure, title: 'Reload failed', message: data.error || `HTTP ${res.status}` });
      return;
    }
    showToast({ style: Toast.Style.Success, title: 'Extension reloaded' });
  } catch {
    showToast({
      style: Toast.Style.Failure,
      title: 'Bridge not reachable',
      message: 'Make sure the bridge is running.',
    });
  }
}
