import { showToast, Toast, showHUD } from '@raycast/api';
import { BRIDGE_HTTP_URL } from '@extension/protocol';

export default async function OpenOptions() {
  try {
    const res = await fetch(`${BRIDGE_HTTP_URL}/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commandId: 'open-options' }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      await showToast({ style: Toast.Style.Failure, title: 'Failed', message: data.error || `HTTP ${res.status}` });
      return;
    }
    await showHUD('Opening extension settings…');
  } catch {
    await showToast({
      style: Toast.Style.Failure,
      title: 'Bridge not reachable',
      message: 'Make sure Chrome is open with the extension installed.',
    });
  }
}
