import { showToast, Toast } from '@raycast/api';
import { buildExtension } from './build-extension';
import { reloadExtension } from './reload-extension';

export default async function command() {
  const toast = await showToast({ style: Toast.Style.Animated, title: 'Step 1/2', message: 'Building...' });

  const built = await buildExtension(toast);
  if (!built) return;

  toast.title = 'Step 2/2';
  const reloaded = await reloadExtension(toast);
  if (!reloaded) return;

  toast.style = Toast.Style.Success;
  toast.title = 'Done';
  toast.message = 'Built & reloaded';
}
