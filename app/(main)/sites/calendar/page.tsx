import React from 'react';
import { auth } from '@/app/lib/auth';
import { getCalendarData } from '@/app/actions/calendar';
import CalendarClient from './CalendarClient';

export default async function CalendarPage(): Promise<React.JSX.Element> {
  const session = await auth();
  if (!session?.user?.orgId) {
    return (
      <div className="p-4">
        <p className="text-sm text-slate-600">
          You must be signed in to view the calendar.
        </p>
      </div>
    );
  }

  const { accounts, events } = await getCalendarData();
  return (
    <div className="p-3 h-[calc(100vh-4rem)]">
      <CalendarClient accounts={accounts} events={events} />
    </div>
  );
}
