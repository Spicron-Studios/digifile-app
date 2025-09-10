'use client';

import { Calendar } from '@/app/components/ui/calendar';
import { useState, useEffect } from 'react';

interface CalendarClientProps {
  accounts: import('@/app/types/calendar').Account[];
  events: import('@/app/types/calendar').CalendarEvent[];
  defaultSelectedAccount?: string | undefined;
  hasAdminAccess: boolean;
}

export default function CalendarClient({
  accounts,
  events,
  defaultSelectedAccount,
  hasAdminAccess,
}: CalendarClientProps): React.JSX.Element {
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);

  useEffect(() => {
    // Initialize selected accounts based on defaultSelectedAccount
    if (defaultSelectedAccount) {
      setSelectedAccounts([defaultSelectedAccount]);
    } else if (accounts.length > 0) {
      // If no default account, select the first account
      setSelectedAccounts([accounts[0].AccountID]);
    }
  }, [defaultSelectedAccount, accounts]);

  const handleAccountToggle = (accountId: string) => {
    setSelectedAccounts(current =>
      current.includes(accountId)
        ? current.filter(id => id !== accountId)
        : [...current, accountId]
    );
  };

  // Debugging
  console.log('CalendarClient props:', {
    accounts,
    events,
    defaultSelectedAccount,
    hasAdminAccess,
  });
  console.log('Selected accounts:', selectedAccounts);

  return (
    <Calendar
      accounts={accounts}
      events={events}
      refreshData={async () => {}}
      hasAdminAccess={hasAdminAccess}
      defaultSelectedAccount={defaultSelectedAccount}
      selectedAccounts={selectedAccounts}
      onToggleAccount={handleAccountToggle}
    />
  );
}
