import { getCalendarData } from '@/app/actions/calendar';
import { auth } from '@/app/lib/auth';
import CalendarClient from './CalendarClient';

export default async function CalendarPage(): Promise<React.JSX.Element> {
  const session = await auth();
  const hasAdminAccess = !!session?.user?.roles?.some(
    r =>
      r.role.name.toLowerCase() === 'admin' ||
      r.role.name.toLowerCase() === 'organizer'
  );
  const { accounts, events } = await getCalendarData();

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="container mx-auto py-8 px-4">
        <CalendarClient
          accounts={accounts}
          events={events}
          hasAdminAccess={hasAdminAccess}
          defaultSelectedAccount={session?.user?.id}
        />
      </div>
    </div>
  );
}
