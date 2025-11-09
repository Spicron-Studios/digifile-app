'use client';
import { getLogger } from '@/app/lib/logger';

import * as React from 'react';
import { useEffect } from 'react';
import {
  Home,
  FileText,
  Settings,
  Menu,
  Calendar as CalendarIcon,
  Users,
} from 'lucide-react';
import { cn } from '@/app/lib/utils';
import { Button } from '@/app/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/app/components/ui/tooltip';
import {
  Sidebar,
  SidebarContent,
  SidebarTrigger,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  useSidebar,
} from '@/app/components/ui/sidebar';

const navItems = [
  { name: 'Home', icon: Home, href: '/sites' },
  { name: 'Calendar', icon: CalendarIcon, href: '/sites/calendar' },
  { name: 'File Data', icon: FileText, href: '/sites/file-data' },
  { name: 'Patients', icon: Users, href: '/sites/patients' },
  { name: 'Settings', icon: Settings, href: '/sites/settings' },
];

function SidebarWrapper() {
  const { state, toggle } = useSidebar();
  const isCollapsed = state === 'collapsed';

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const logger = getLogger();
      void logger.debug(
        'app/components/ui/collapsible-sidebar.tsx',
        `SidebarWrapper rendered, state: ${JSON.stringify(state)}`
      );
    }
  }, [state]);

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="flex items-center p-2">
        <SidebarTrigger onClick={toggle} className="h-8 w-8">
          <Menu className="h-5 w-5" />
        </SidebarTrigger>
      </SidebarHeader>
      <SidebarContent className="flex flex-col gap-2 px-1 py-4">
        {navItems.map(item => (
          <Tooltip key={item.name} delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  'w-full',
                  isCollapsed
                    ? 'h-8 w-8 p-0 justify-center'
                    : 'px-2 justify-start'
                )}
                asChild
              >
                <a
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2',
                    isCollapsed ? 'justify-center' : 'justify-start w-full'
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!isCollapsed && <span>{item.name}</span>}
                </a>
              </Button>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side="right" className="ml-1">
                {item.name}
              </TooltipContent>
            )}
          </Tooltip>
        ))}
      </SidebarContent>
      <SidebarFooter className="p-2">
        {!isCollapsed && (
          <span className="text-sm text-muted-foreground">Login Here</span>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

export function CollapsibleSidebar() {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <SidebarWrapper />
      </SidebarProvider>
    </TooltipProvider>
  );
}
