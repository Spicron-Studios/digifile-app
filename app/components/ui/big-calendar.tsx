'use client';

import { Calendar, momentLocalizer, DateHeaderProps } from 'react-big-calendar';
import moment from 'moment';
import 'moment-timezone';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Account, CalendarEvent } from '@/app/types/calendar';
import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { RefreshCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { AppointmentModal } from '@/app/components/ui/appointment/appointment-modal';
import { AccountSelector } from '@/app/components/ui/account-selector/account-selector';
import { cn } from '@/app/lib/utils';

// Set moment to use South African Standard Time (UTC+2)
moment.tz.setDefault('Africa/Johannesburg');

// Initialize the localizer for date formatting
const localizer = momentLocalizer(moment);

interface BigCalendarProps {
  accounts: Account[];
  events: CalendarEvent[];
  refreshData: () => void;
  hasAdminAccess: boolean;
  defaultSelectedAccount?: string | undefined;
  selectedAccounts: string[];
  onToggleAccount: (_accountId: string) => void;
}

export function BigCalendar({
  accounts,
  events,
  refreshData,
  hasAdminAccess,
  selectedAccounts,
  onToggleAccount,
}: BigCalendarProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [view, setView] = useState<any>('month');
  const [date, setDate] = useState(new Date());

  // Filter events based on selected accounts
  const filteredEvents = events.filter(
    event =>
      selectedAccounts.length === 0 ||
      selectedAccounts.includes(event.accountId)
  );

  // Format events for Big Calendar
  const formattedEvents = filteredEvents
    .map(event => {
      const start = new Date(event.start);
      const end = new Date(event.end);

      // Validate dates
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('Invalid date in event:', event);
        }
        return null;
      }

      // Find the account to get the correct color
      const account = accounts.find(acc => acc.AccountID === event.accountId);
      const eventColor = account?.color || event.color || 'bg-gray-500';

      return {
        ...event,
        start,
        end,
        title: `${event.accountName}: ${event.title}`,
        allDay: false,
        color: eventColor, // Use the account color
      };
    })
    .filter((event): event is NonNullable<typeof event> => event !== null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Custom event tile with professional design
  const eventTile = (props: any) => {
    const event = props.event;

    // Validate event data
    if (!event) {
      return <div className="p-2 text-red-500">Invalid event data</div>;
    }

    // Find the account to get the correct color
    const account = accounts.find(acc => acc.AccountID === event.accountId);
    const eventColor = account?.color || event.color || 'bg-gray-500';

    return (
      <div
        className={cn(
          'px-3 py-2 rounded-lg truncate shadow-sm border border-white/20',
          'text-xs font-medium text-white',
          'hover:shadow-md hover:scale-[1.02] cursor-pointer transition-all duration-200',
          'backdrop-blur-sm flex flex-col h-full'
        )}
        style={{
          backgroundColor: eventColor,
        }}
      >
        <div className="truncate font-semibold text-sm">{event.title}</div>
        <div className="truncate text-xs opacity-90 mt-1">
          {moment.tz(props.start, 'Africa/Johannesburg').format('HH:mm')} -{' '}
          {moment.tz(props.end, 'Africa/Johannesburg').format('HH:mm')}
        </div>
        <div className="truncate text-xs opacity-75 mt-1">
          {event.accountName}
        </div>
      </div>
    );
  };

  // Custom header with professional design
  const header = (props: any) => {
    // Validate props
    if (!props || !props.date) {
      return <div className="rbc-header">Invalid date</div>;
    }

    return (
      <div className="rbc-header py-2">
        <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">
          {props.label}
        </div>
        <div className="text-lg font-bold mt-1 text-gray-800">
          {props.date.getDate()}
        </div>
      </div>
    );
  };

  // Custom date header for month view
  const dateHeader = (props: DateHeaderProps) => {
    return (
      <div className="rbc-date-cell rbc-current-time-indicator">
        <div className="rbc-date-cell-number">{props.label}</div>
      </div>
    );
  };

  // Custom toolbar for professional look
  const Toolbar = () => (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
        <div className="h-6 w-px bg-gray-300 hidden md:block"></div>
        <AccountSelector
          accounts={accounts}
          selectedAccounts={selectedAccounts}
          onToggleAccount={onToggleAccount}
          _onAddAccount={account => onToggleAccount(account.AccountID)}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              const newDate = moment
                .tz(date, 'Africa/Johannesburg')
                .subtract(
                  1,
                  view === 'day' ? 'day' : view === 'week' ? 'week' : 'month'
                )
                .toDate();
              setDate(newDate);
            }}
            className="h-9 w-9"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              const newDate = moment
                .tz(date, 'Africa/Johannesburg')
                .add(
                  1,
                  view === 'day' ? 'day' : view === 'week' ? 'week' : 'month'
                )
                .toDate();
              setDate(newDate);
            }}
            className="h-9 w-9"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setDate(new Date())}
            className="h-9 px-3 text-sm"
          >
            Today
          </Button>
        </div>

        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          <Button
            variant={view === 'day' ? 'default' : 'ghost'}
            onClick={() => setView('day')}
            className={cn(
              'h-9 px-4 text-sm',
              view === 'day' ? 'bg-white shadow-sm' : 'hover:bg-white/50'
            )}
          >
            Day
          </Button>
          <Button
            variant={view === 'week' ? 'default' : 'ghost'}
            onClick={() => setView('week')}
            className={cn(
              'h-9 px-4 text-sm',
              view === 'week' ? 'bg-white shadow-sm' : 'hover:bg-white/50'
            )}
          >
            Week
          </Button>
          <Button
            variant={view === 'month' ? 'default' : 'ghost'}
            onClick={() => setView('month')}
            className={cn(
              'h-9 px-4 text-sm',
              view === 'month' ? 'bg-white shadow-sm' : 'hover:bg-white/50'
            )}
          >
            Month
          </Button>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="h-9 w-9"
        >
          <RefreshCcw
            className={cn('h-4 w-4', isRefreshing && 'animate-spin')}
          />
        </Button>

        <AppointmentModal
          accounts={accounts}
          onAppointmentAdded={refreshData}
          hasAdminAccess={hasAdminAccess}
        />
      </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-200px)] flex flex-col">
      <Toolbar />

      <div className="flex-1 overflow-hidden bg-white rounded-xl shadow-sm border border-gray-200">
        {formattedEvents && formattedEvents.length > 0 ? (
          <Calendar
            localizer={localizer}
            events={formattedEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            view={view}
            views={['month', 'week', 'day']}
            date={date}
            onNavigate={setDate}
            onView={setView}
            components={{
              event: eventTile,
              header: header,
              month: {
                dateHeader: dateHeader,
              },
            }}
            eventPropGetter={(event: CalendarEvent) => {
              // Find the account to get the correct color
              const account = accounts.find(
                acc => acc.AccountID === event.accountId
              );
              const eventColor = account?.color || event.color || 'bg-gray-500';

              return {
                className: 'text-white rounded-lg',
                style: { backgroundColor: eventColor },
              };
            }}
            dayPropGetter={() => ({
              className: 'rbc-day-slot hover:bg-gray-50/50 transition-colors',
            })}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-8 text-gray-500">
            <div className="text-lg mb-2">No calendar events found</div>
            <p className="text-sm text-gray-400">
              Add appointments to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
