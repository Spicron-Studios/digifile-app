'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight, RefreshCcw } from 'lucide-react';
import {
  add,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isEqual,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfToday,
  startOfWeek,
} from 'date-fns';
import { Account, CalendarEvent, ViewType } from '@/app/types/calendar';
import { Button } from '@/app/components/ui/button';
import { AccountSelector } from './account-selector/account-selector';
import { cn } from '@/app/lib/utils';
import { AppointmentModal } from '@/app/components/ui/appointment/appointment-modal';
import { useState } from 'react';

interface CalendarProps {
  accounts: Account[];
  events: CalendarEvent[];
  refreshData: () => void;
  hasAdminAccess: boolean;
  defaultSelectedAccount?: string | undefined;
  selectedAccounts: string[];
  onToggleAccount: (_accountId: string) => void;
}

interface EventDisplayProps {
  event: CalendarEvent;
  className?: string;
  accounts: Account[];
  refreshData: () => void;
  style?: React.CSSProperties;
}

const EventDisplay = ({
  event,
  className,
  accounts,
  refreshData,
  style,
}: EventDisplayProps) => {
  const [showModal, setShowModal] = useState(false);
  const eventStart = new Date(event.start);
  const eventEnd = new Date(event.end);

  // Calculate duration in hours for proper sizing
  const durationHours =
    (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60 * 60);
  const startHour = eventStart.getHours() + eventStart.getMinutes() / 60;

  const eventStyle: React.CSSProperties = {
    ...style,
    top: `${startHour * 64}px`, // 64px is the height of each hour slot
    height: `${Math.max(durationHours * 64, 32)}px`, // Minimum 32px height
    position: 'absolute' as const,
    width: '95%',
    zIndex: 10,
    marginLeft: '2%',
  };

  return (
    <>
      <div
        className={cn(
          `${event.color}`,
          'px-3 py-2 rounded-lg truncate shadow-sm border border-white/20',
          'text-xs font-medium text-white',
          'hover:shadow-md hover:scale-[1.02] cursor-pointer transition-all duration-200',
          'backdrop-blur-sm',
          className
        )}
        style={eventStyle}
        title={`${event.accountName}: ${event.title}\n${format(eventStart, 'HH:mm')} - ${format(eventEnd, 'HH:mm')}`}
        onClick={e => {
          e.stopPropagation();
          setShowModal(true);
        }}
      >
        <div className="truncate font-semibold text-sm">{event.title}</div>
        <div className="truncate text-xs opacity-90 mt-1">
          {format(eventStart, 'HH:mm')} - {format(eventEnd, 'HH:mm')}
        </div>
        <div className="truncate text-xs opacity-75">{event.accountName}</div>
      </div>
      {showModal && (
        <AppointmentModal
          accounts={accounts}
          onAppointmentAdded={refreshData}
          selectedEvent={event}
          defaultOpen={true}
          onOpenChange={setShowModal}
        />
      )}
    </>
  );
};

export function Calendar({
  accounts,
  events,
  refreshData,
  selectedAccounts,
  onToggleAccount,
}: CalendarProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const today = startOfToday();
  const [selectedDay, setSelectedDay] = React.useState(today);
  const [currentDate, setCurrentDate] = React.useState(today);
  const [view, setView] = React.useState<ViewType>('month');

  function previousPeriod() {
    setCurrentDate(prev => {
      switch (view) {
        case 'day':
          return add(prev, { days: -1 });
        case 'week':
          return add(prev, { weeks: -1 });
        case 'month':
          return add(prev, { months: -1 });
        default:
          return prev;
      }
    });
  }

  function nextPeriod() {
    setCurrentDate(prev => {
      switch (view) {
        case 'day':
          return add(prev, { days: 1 });
        case 'week':
          return add(prev, { weeks: 1 });
        case 'month':
          return add(prev, { months: 1 });
        default:
          return prev;
      }
    });
  }

  const days = React.useMemo(() => {
    switch (view) {
      case 'day':
        return [currentDate];
      case 'week':
        return eachDayOfInterval({
          start: startOfWeek(currentDate),
          end: endOfWeek(currentDate),
        });
      case 'month':
        return eachDayOfInterval({
          start: startOfWeek(startOfMonth(currentDate)),
          end: endOfWeek(endOfMonth(currentDate)),
        });
      default:
        return [];
    }
  }, [currentDate, view]);

  const filteredEvents = events.filter(event =>
    selectedAccounts.includes(event.accountId)
  );

  const timeSlots = Array.from({ length: 24 }, (_, i) => i);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="h-[900px] flex flex-col bg-gray-50/50">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-6">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
              <div className="h-6 w-px bg-gray-300"></div>
            </div>
            <AccountSelector
              accounts={accounts}
              selectedAccounts={selectedAccounts}
              onToggleAccount={onToggleAccount}
              onAddAccount={account => onToggleAccount(account.AccountID)}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              className="hover:bg-blue-50 hover:border-blue-200 transition-colors"
              disabled={isRefreshing}
            >
              <RefreshCcw
                className={cn(
                  'h-4 w-4 text-blue-600',
                  isRefreshing && 'animate-spin'
                )}
              />
            </Button>
          </div>
          <div className="flex gap-3">
            <AppointmentModal
              accounts={accounts}
              onAppointmentAdded={handleRefresh}
            />
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex items-center justify-between bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={previousPeriod}
                className="hover:bg-blue-50 hover:border-blue-200 transition-colors h-10 w-10"
              >
                <ChevronLeft className="w-5 h-5 text-blue-600" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={nextPeriod}
                className="hover:bg-blue-50 hover:border-blue-200 transition-colors h-10 w-10"
              >
                <ChevronRight className="w-5 h-5 text-blue-600" />
              </Button>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 min-w-[200px]">
              {format(
                currentDate,
                view === 'day' ? 'EEEE, MMMM d, yyyy' : 'MMMM yyyy'
              )}
            </h2>
            <Button
              variant="outline"
              onClick={() => setCurrentDate(today)}
              className="text-blue-600 border-blue-200 hover:bg-blue-50 transition-colors"
            >
              Today
            </Button>
          </div>
          <div className="flex gap-1 bg-gray-100 p-1.5 rounded-lg border">
            <Button
              variant={view === 'day' ? 'default' : 'ghost'}
              onClick={() => setView('day')}
              className={cn(
                'h-9 px-4 transition-all',
                view === 'day'
                  ? 'bg-white shadow-sm text-gray-900 font-medium'
                  : 'hover:bg-white/50 text-gray-600'
              )}
            >
              Day
            </Button>
            <Button
              variant={view === 'week' ? 'default' : 'ghost'}
              onClick={() => setView('week')}
              className={cn(
                'h-9 px-4 transition-all',
                view === 'week'
                  ? 'bg-white shadow-sm text-gray-900 font-medium'
                  : 'hover:bg-white/50 text-gray-600'
              )}
            >
              Week
            </Button>
            <Button
              variant={view === 'month' ? 'default' : 'ghost'}
              onClick={() => setView('month')}
              className={cn(
                'h-9 px-4 transition-all',
                view === 'month'
                  ? 'bg-white shadow-sm text-gray-900 font-medium'
                  : 'hover:bg-white/50 text-gray-600'
              )}
            >
              Month
            </Button>
          </div>
        </div>
        {view === 'month' ? (
          <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-xl shadow-sm border border-gray-100">
            {/* Month Header */}
            <div className="grid grid-cols-7 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              {[
                'Sunday',
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday',
              ].map(day => (
                <div key={day} className="p-4 text-center">
                  <div className="text-sm font-semibold text-gray-700">
                    {day}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {day.slice(0, 3).toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
            {/* Month Grid */}
            <div className="grid grid-cols-7 flex-1 overflow-y-auto">
              {days.map((day, dayIdx) => (
                <div
                  key={day.toString()}
                  className={cn(
                    'relative min-h-[140px] p-3 hover:bg-blue-50/50 cursor-pointer border-b border-r border-gray-100 transition-colors',
                    dayIdx === 0 && colStartClasses[getDay(day)],
                    !isSameMonth(day, currentDate) &&
                      'text-gray-400 bg-gray-50/30',
                    isEqual(day, selectedDay) && 'bg-blue-50 border-blue-200',
                    isToday(day) &&
                      'bg-gradient-to-br from-blue-50 to-indigo-50'
                  )}
                  onClick={() => setSelectedDay(day)}
                >
                  <time
                    dateTime={format(day, 'yyyy-MM-dd')}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium mb-2',
                      isToday(day) && 'bg-blue-600 text-white shadow-lg',
                      isEqual(day, selectedDay) &&
                        !isToday(day) &&
                        'bg-blue-100 text-blue-700',
                      !isToday(day) &&
                        !isEqual(day, selectedDay) &&
                        'hover:bg-gray-100'
                    )}
                  >
                    {format(day, 'd')}
                  </time>
                  <div className="space-y-1">
                    {filteredEvents
                      .filter(event => isSameDay(event.start, day))
                      .filter(
                        (event, index, self) =>
                          index === self.findIndex(e => e.id === event.id)
                      )
                      .slice(0, 3) // Show max 3 events
                      .map(event => (
                        <EventDisplay
                          key={event.id}
                          event={event}
                          className={cn(
                            'text-xs px-2 py-1 rounded-md font-medium shadow-sm truncate',
                            event.color,
                            'text-white hover:shadow-md transition-shadow'
                          )}
                          accounts={accounts}
                          refreshData={refreshData}
                        />
                      ))}
                    {filteredEvents.filter(event => isSameDay(event.start, day))
                      .length > 3 && (
                      <div className="text-xs text-gray-500 px-2 py-1">
                        +
                        {filteredEvents.filter(event =>
                          isSameDay(event.start, day)
                        ).length - 3}{' '}
                        more
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="grid grid-cols-[80px,1fr] h-full">
              {/* Time Column */}
              <div className="border-r border-gray-200 bg-gray-50/50">
                <div className="h-16 border-b border-gray-200"></div>{' '}
                {/* Header spacer */}
                {timeSlots.map(hour => (
                  <div
                    key={hour}
                    className="relative h-16 border-b border-gray-100"
                  >
                    <div className="absolute -top-2 right-3 text-xs font-medium text-gray-500 bg-white px-1">
                      {format(new Date(2024, 0, 1, hour), 'HH:mm')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="relative overflow-auto">
                {/* Day Headers */}
                <div
                  className={cn(
                    'sticky top-0 z-20 bg-white border-b border-gray-200',
                    view === 'week' ? 'grid grid-cols-7' : 'grid grid-cols-1'
                  )}
                >
                  {days.map(day => (
                    <div
                      key={day.toString()}
                      className={cn(
                        'p-4 text-center font-semibold border-r border-gray-100 last:border-r-0',
                        isToday(day) && 'bg-blue-50 text-blue-700'
                      )}
                    >
                      <div className="text-sm text-gray-600">
                        {format(day, 'EEE')}
                      </div>
                      <div
                        className={cn(
                          'text-lg font-bold mt-1',
                          isToday(day) ? 'text-blue-700' : 'text-gray-900'
                        )}
                      >
                        {format(day, 'd')}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Time Grid */}
                <div
                  className={cn(
                    'relative',
                    view === 'week' ? 'grid grid-cols-7' : 'grid grid-cols-1'
                  )}
                >
                  {days.map(day => (
                    <div
                      key={day.toString()}
                      className="relative border-r border-gray-100 last:border-r-0"
                      style={{ height: `${24 * 64}px` }}
                    >
                      {/* Hour Lines */}
                      {timeSlots.map(hour => (
                        <div
                          key={hour}
                          className={cn(
                            'absolute w-full border-t',
                            hour % 2 === 0
                              ? 'border-gray-200'
                              : 'border-gray-100'
                          )}
                          style={{ top: `${hour * 64}px`, height: '64px' }}
                        />
                      ))}

                      {/* Current Time Indicator */}
                      {isToday(day) && (
                        <div
                          className="absolute w-full z-10"
                          style={{
                            top: `${(new Date().getHours() + new Date().getMinutes() / 60) * 64}px`,
                          }}
                        >
                          <div className="h-0.5 bg-red-500 relative">
                            <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full"></div>
                          </div>
                        </div>
                      )}

                      {/* Events */}
                      {filteredEvents
                        .filter(event => isSameDay(new Date(event.start), day))
                        .map(event => (
                          <EventDisplay
                            key={event.id}
                            event={event}
                            accounts={accounts}
                            refreshData={refreshData}
                          />
                        ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const colStartClasses = [
  '',
  'col-start-2',
  'col-start-3',
  'col-start-4',
  'col-start-5',
  'col-start-6',
  'col-start-7',
];
