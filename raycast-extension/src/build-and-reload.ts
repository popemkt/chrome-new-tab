import { showToast, Toast } from '@raycast/api';
import { BRIDGE_HTTP_URL } from '@extension/protocol';
import { buildExtension } from './build-extension';

export default async function command() {
  const built = await buildExtension();
  if (!built) return;

  try {
    const res = await fetch(`${BRIDGE_HTTP_URL}/reload-extension`, { method: 'POST' });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      showToast({ style: Toast.Style.Failure, title: 'Reload failed', message: data.error || `HTTP ${res.status}` });
      return;
    }
    showToast({ style: Toast.Style.Success, title: 'Built & reloaded' });
  } catch {
    showToast({
      style: Toast.Style.Failure,
      title: 'Reload failed',
      message: 'Bridge not reachable.',
    });
  }
}
