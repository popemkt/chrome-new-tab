import type * as React from 'react';
import { cn } from '@/lib/utils';
import { Separator } from './separator';

export interface SidebarApp {
  id: string;
  name: string;
  icon: React.ReactNode;
}

interface AppSidebarProps {
  apps: SidebarApp[];
  activeAppId: string;
  onAppSelect: (appId: string) => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function AppSidebar({ apps, activeAppId, onAppSelect, header, footer, className }: AppSidebarProps) {
  return (
    <aside
      className={cn(
        'flex h-full w-[72px] flex-col items-center gap-2 bg-sidebar py-3',
        'border-r border-sidebar-border',
        className,
      )}>
      {header && (
        <>
          <div className="flex items-center justify-center">{header}</div>
          <Separator className="mx-auto w-8" />
        </>
      )}

      <nav className="flex flex-1 flex-col items-center gap-2">
        {apps.map(app => {
          const isActive = activeAppId === app.id;
          return (
            <SidebarItem key={app.id} name={app.name} isActive={isActive} onClick={() => onAppSelect(app.id)}>
              {app.icon}
            </SidebarItem>
          );
        })}
      </nav>

      {footer && (
        <>
          <Separator className="mx-auto w-8" />
          <div className="flex flex-col items-center gap-2">{footer}</div>
        </>
      )}
    </aside>
  );
}

interface SidebarItemProps {
  name: string;
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function SidebarItem({ name, isActive, onClick, children }: SidebarItemProps) {
  return (
    <div className="group relative flex items-center justify-center w-full">
      {/* Active / hover indicator pill on left edge */}
      <div
        className={cn(
          'absolute left-0 w-1 rounded-r-full bg-sidebar-foreground transition-all duration-200',
          isActive ? 'h-10' : 'h-0 group-hover:h-5',
        )}
      />

      {/* Icon button */}
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'flex h-12 w-12 items-center justify-center border-none cursor-pointer transition-all duration-200',
          isActive
            ? 'rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground'
            : 'rounded-3xl bg-sidebar text-sidebar-foreground/60 hover:rounded-2xl hover:bg-sidebar-primary hover:text-sidebar-primary-foreground',
        )}>
        {children}
      </button>

      {/* CSS tooltip - appears on hover, no React state needed */}
      <div
        role="tooltip"
        className="pointer-events-none absolute left-full ml-3 z-50 hidden rounded-md bg-popover px-3 py-1.5 text-xs font-medium text-popover-foreground shadow-md group-hover:block whitespace-nowrap">
        {name}
      </div>
    </div>
  );
}

interface AppLayoutProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function AppLayout({ sidebar, children, className }: AppLayoutProps) {
  return (
    <div className={cn('flex h-screen w-full overflow-hidden bg-background', className)}>
      {sidebar}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
