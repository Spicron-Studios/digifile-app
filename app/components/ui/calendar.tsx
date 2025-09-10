'use client';

import * as React from 'react';
import { Account, CalendarEvent } from '@/app/types/calendar';
import { BigCalendar } from '@/app/components/ui/big-calendar';

interface CalendarProps {
  accounts: Account[];
  events: CalendarEvent[];
  refreshData: () => void;
  hasAdminAccess: boolean;
  defaultSelectedAccount?: string | undefined;
  selectedAccounts: string[];
  onToggleAccount: (_accountId: string) => void;
}

export function Calendar({
  accounts,
  events,
  refreshData,
  hasAdminAccess,
  selectedAccounts,
  onToggleAccount,
}: CalendarProps) {
  // Debugging
  console.log('Calendar props:', {
    accounts,
    events,
    hasAdminAccess,
    selectedAccounts,
  });

  return (
    <BigCalendar
      accounts={accounts}
      events={events}
      refreshData={refreshData}
      hasAdminAccess={hasAdminAccess}
      selectedAccounts={selectedAccounts}
      onToggleAccount={onToggleAccount}
    />
  );
}
