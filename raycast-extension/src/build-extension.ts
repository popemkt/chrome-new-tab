import { showToast, Toast } from '@raycast/api';
import { BRIDGE_HTTP_URL } from '@extension/protocol';

export async function buildExtension(toast?: Toast): Promise<boolean> {
  if (!toast) toast = await showToast({ style: Toast.Style.Animated, title: 'Building...' });
  toast.style = Toast.Style.Animated;
  toast.title = 'Building extension...';
  toast.message = 'Running pnpm build';
  try {
    const res = await fetch(`${BRIDGE_HTTP_URL}/dev/build`, { method: 'POST' });
    const data = (await res.json()) as { error?: string; details?: string };
    if (!res.ok) {
      toast.style = Toast.Style.Failure;
      toast.title = 'Build failed';
      toast.message = data.details || data.error || `HTTP ${res.status}`;
      return false;
    }
    toast.style = Toast.Style.Success;
    toast.title = 'Build succeeded';
    toast.message = undefined;
    return true;
  } catch {
    toast.style = Toast.Style.Failure;
    toast.title = 'Bridge not reachable';
    toast.message = 'Make sure the bridge is running.';
    return false;
  }
}

export default async function command() {
  await buildExtension();
}
