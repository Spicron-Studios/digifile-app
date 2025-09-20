'use client';

import React, { useMemo } from 'react';
import {
  Calendar as RBCalendar,
  Views,
  dateFnsLocalizer,
} from 'react-big-calendar';
import { parse, startOfWeek, getDay, format } from 'date-fns';
import enZA from 'date-fns/locale/en-ZA';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import type { CalendarEvent } from '@/app/types/calendar';

const locales = { 'en-ZA': enZA } as const;
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

export interface BigCalendarProps {
  events: CalendarEvent[];
  resources: Array<{ id: string; title: string }>;
  date: Date;
  onNavigate?: (_date: Date) => void;
  onSelectSlot?: (_range: { start: Date; end: Date }) => void;
  onSelectEvent?: (_event: CalendarEvent) => void;
}

export default function BigCalendar(
  props: BigCalendarProps
): React.JSX.Element {
  const { events, resources, onSelectEvent, onSelectSlot, date, onNavigate } =
    props;

  const eventPropGetter = useMemo(() => {
    return (
      _event: CalendarEvent,
      _start: Date,
      _end: Date,
      _isSelected: boolean
    ) => {
      return {
        style: {
          backgroundColor: _event.color,
          borderLeft: `3px solid ${_event.color}`,
          color: '#0f172a',
        },
      };
    };
  }, []);

  return (
    <div className="rbc-theme text-sm">
      <RBCalendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        resources={resources}
        resourceIdAccessor="id"
        resourceTitleAccessor="title"
        views={[Views.DAY]}
        defaultView={Views.DAY}
        toolbar={false}
        date={date}
        onNavigate={d => onNavigate?.(d as Date)}
        step={60}
        timeslots={1}
        min={new Date(1970, 0, 1, 5, 0)}
        max={new Date(1970, 0, 1, 20, 0)}
        selectable
        onSelectEvent={e => onSelectEvent?.(e as CalendarEvent)}
        onSelectSlot={slot =>
          onSelectSlot?.({ start: slot.start as Date, end: slot.end as Date })
        }
        style={{ height: '100%' }}
        eventPropGetter={eventPropGetter}
      />
    </div>
  );
}
