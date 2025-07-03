'use client';

import { Calendar } from '@/app/components/ui/calendar';
import { Account, CalendarEvent } from '@/app/types/calendar';
import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export default function CalendarPage() {
  const { data: session } = useSession();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ensure hasAdminAccess is always a boolean
  const hasAdminAccess = !!session?.user?.roles?.some(
    r =>
      r.role.name.toLowerCase() === 'admin' ||
      r.role.name.toLowerCase() === 'organizer'
  );

  const fetchCalendarData = useCallback(async () => {
    try {
      const response = await fetch('/api/calendar', {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch calendar data');
      }

      setAccounts(data.accounts);
      setEvents(data.events);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to load calendar data.'
      );
      throw error;
    }
  }, []);

  // Initial load
  useEffect(() => {
    const initializeCalendar = async () => {
      setIsLoading(true);
      try {
        if (session?.user?.id) {
          setSelectedAccounts([session.user.id]);
          await fetchCalendarData();
        }
      } catch {
        // Error is already handled by fetchCalendarData
      } finally {
        setIsLoading(false);
      }
    };

    initializeCalendar();
  }, [session?.user?.id, fetchCalendarData]);

  const handleAccountToggle = (accountId: string) => {
    setSelectedAccounts(current =>
      current.includes(accountId)
        ? current.filter(id => id !== accountId)
        : [...current, accountId]
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 px-4 h-screen">
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 font-medium">Loading calendar...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6 px-4 h-screen">
        <div className="flex items-center justify-center h-full">
          <div className="text-center space-y-4 max-w-md">
            <div className="text-red-500 text-4xl">⚠️</div>
            <p className="text-red-600 font-medium text-lg">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="container mx-auto py-8 px-4">
        <Calendar
          accounts={accounts}
          events={events}
          refreshData={fetchCalendarData}
          hasAdminAccess={hasAdminAccess}
          defaultSelectedAccount={session?.user?.id}
          selectedAccounts={selectedAccounts}
          onToggleAccount={handleAccountToggle}
        />
      </div>
    </div>
  );
}
