import { exampleThemeStorage } from '@extension/storage';
import { useStorage } from '@extension/shared';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '@/lib/utils';

type ToggleButtonProps = ComponentPropsWithoutRef<'button'>;

export const ToggleButton = ({ className, children, ...props }: ToggleButtonProps) => {
  const theme = useStorage(exampleThemeStorage);

  return (
    <button
      className={cn(
        className,
        'mt-4 border-2 py-1 px-4 rounded-md font-bold shadow-sm transition-colors',
        'bg-secondary text-secondary-foreground border-border',
        'hover:bg-accent hover:text-accent-foreground',
      )}
      onClick={exampleThemeStorage.toggle}
      data-theme={theme}
      {...props}>
      {children}
    </button>
  );
};
