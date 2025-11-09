'use client';
import { getLogger } from '@/app/lib/logger';

import * as React from 'react';
import { createContext, useContext, useState } from 'react';
import { cn } from '../../lib/utils';

type SidebarState = 'expanded' | 'collapsed';
type SidebarContextType = {
  state: SidebarState;
  toggle: () => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SidebarState>('expanded');

  const toggle = () => {
    setState(prev => {
      const next = prev === 'expanded' ? 'collapsed' : 'expanded';
      if (process.env.NODE_ENV === 'development') {
        const logger = getLogger();
        void logger.debug(
          'app/components/ui/sidebar.tsx',
          `Toggle called, previous: ${prev}, next: ${next}`
        );
      }
      return next;
    });
  };

  return (
    <SidebarContext.Provider value={{ state, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
}

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context)
    throw new Error('useSidebar must be used within SidebarProvider');
  return context;
};

export const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { collapsible?: 'icon' }
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex flex-col h-full', className)} {...props} />
));
Sidebar.displayName = 'Sidebar';

export const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={className} {...props} />
));
SidebarHeader.displayName = 'SidebarHeader';

export const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex-1', className)} {...props} />
));
SidebarContent.displayName = 'SidebarContent';

export const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('mt-auto', className)} {...props} />
));
SidebarFooter.displayName = 'SidebarFooter';

export const SidebarTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button ref={ref} className={className} {...props} />
));
SidebarTrigger.displayName = 'SidebarTrigger';
