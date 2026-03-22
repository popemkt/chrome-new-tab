import * as React from 'react';
import { cn } from '@/lib/utils';

interface TooltipProviderProps {
  children: React.ReactNode;
  delayDuration?: number;
}

interface TooltipContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  delayDuration: number;
}

const TooltipContext = React.createContext<TooltipContextValue>({
  open: false,
  setOpen: () => {},
  delayDuration: 200,
});

const TooltipProvider = ({ children, delayDuration = 200 }: TooltipProviderProps) => {
  return <>{children}</>;
};

interface TooltipProps {
  children: React.ReactNode;
  delayDuration?: number;
}

const Tooltip = ({ children, delayDuration = 200 }: TooltipProps) => {
  const [open, setOpen] = React.useState(false);
  return <TooltipContext.Provider value={{ open, setOpen, delayDuration }}>{children}</TooltipContext.Provider>;
};

const TooltipTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ children, ...props }, ref) => {
    const { setOpen, delayDuration } = React.useContext(TooltipContext);
    const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>(undefined);

    return (
      <button
        ref={ref}
        {...props}
        onMouseEnter={e => {
          timeoutRef.current = setTimeout(() => setOpen(true), delayDuration);
          props.onMouseEnter?.(e);
        }}
        onMouseLeave={e => {
          clearTimeout(timeoutRef.current);
          setOpen(false);
          props.onMouseLeave?.(e);
        }}
        onFocus={e => {
          setOpen(true);
          props.onFocus?.(e);
        }}
        onBlur={e => {
          setOpen(false);
          props.onBlur?.(e);
        }}>
        {children}
      </button>
    );
  },
);
TooltipTrigger.displayName = 'TooltipTrigger';

interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
}

const TooltipContent = React.forwardRef<HTMLDivElement, TooltipContentProps>(
  ({ className, side = 'right', sideOffset = 8, children, ...props }, ref) => {
    const { open } = React.useContext(TooltipContext);

    if (!open) return null;

    const positionClasses = {
      top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
      right: 'left-full top-1/2 -translate-y-1/2 ml-2',
      bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
      left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'absolute z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95',
          positionClasses[side],
          className,
        )}
        {...props}>
        {children}
      </div>
    );
  },
);
TooltipContent.displayName = 'TooltipContent';

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
