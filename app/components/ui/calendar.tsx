"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from 'lucide-react'
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
  startOfDay,
  startOfMonth,
  startOfToday,
  startOfWeek,
} from "date-fns"
import { Account, CalendarEvent, ViewType } from "@/app/types/calendar"
import { Button } from "@/app/components/ui/button"
import { AccountSelector } from "./account-selector/account-selector"
import { cn } from "@/app/lib/utils"
import { AppointmentModal } from "@/app/components/ui/appointment/appointment-modal"
import { useState } from "react"
import { formatTimeToLocal } from "@/app/lib/utils";

interface CalendarProps {
  accounts: Account[]
  events: CalendarEvent[]
  refreshData: () => void
  hasAdminAccess: boolean
  defaultSelectedAccount?: string
}

interface EventDisplayProps {
  event: CalendarEvent
  className?: string
  accounts: Account[]
  refreshData: () => void
  style?: React.CSSProperties
}

const EventDisplay = ({ event, className, accounts, refreshData }: EventDisplayProps) => {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <div
        className={cn(
          `${event.color}`,
          "px-2 py-1 rounded-md truncate",
          "text-xs font-medium",
          "hover:opacity-90 cursor-pointer",
          className
        )}
        title={`${event.accountName}: ${event.title}`}
        onClick={(e) => {
          e.stopPropagation()
          setShowModal(true)
        }}
      >
        {event.title}
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
  )
}

export function Calendar({ accounts, events, refreshData, hasAdminAccess, defaultSelectedAccount }: CalendarProps) {
  const today = startOfToday()
  const [selectedDay, setSelectedDay] = React.useState(today)
  const [currentDate, setCurrentDate] = React.useState(today)
  const [view, setView] = React.useState<ViewType>("month")
  const [selectedAccounts, setSelectedAccounts] = React.useState<string[]>(
    defaultSelectedAccount ? [defaultSelectedAccount] : []
  )

  function previousPeriod() {
    setCurrentDate((prev) => {
      switch (view) {
        case "day":
          return add(prev, { days: -1 })
        case "week":
          return add(prev, { weeks: -1 })
        case "month":
          return add(prev, { months: -1 })
        default:
          return prev
      }
    })
  }

  function nextPeriod() {
    setCurrentDate((prev) => {
      switch (view) {
        case "day":
          return add(prev, { days: 1 })
        case "week":
          return add(prev, { weeks: 1 })
        case "month":
          return add(prev, { months: 1 })
        default:
          return prev
      }
    })
  }

  const days = React.useMemo(() => {
    switch (view) {
      case "day":
        return [currentDate]
      case "week":
        return eachDayOfInterval({
          start: startOfWeek(currentDate),
          end: endOfWeek(currentDate),
        })
      case "month":
        return eachDayOfInterval({
          start: startOfWeek(startOfMonth(currentDate)),
          end: endOfWeek(endOfMonth(currentDate)),
        })
      default:
        return []
    }
  }, [currentDate, view])

  function toggleAccount(accountId: string) {
    setSelectedAccounts((current) =>
      current.includes(accountId)
        ? current.filter((id) => id !== accountId)
        : [...current, accountId]
    )
  }

  const filteredEvents = events.filter((event) =>
    selectedAccounts.includes(event.accountId)
  )

  const timeSlots = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div className="p-4 h-[800px] flex flex-col">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <AccountSelector
            accounts={accounts}
            selectedAccounts={selectedAccounts}
            onToggleAccount={toggleAccount}
            onAddAccount={(account) => toggleAccount(account.AccountID)}
          />
          <div className="flex gap-2">
            <AppointmentModal accounts={accounts} onAppointmentAdded={refreshData} />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={previousPeriod}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="font-semibold">
              {format(currentDate, view === "day" ? "MMMM d, yyyy" : "MMMM yyyy")}
            </h2>
            <Button
              variant="outline"
              size="icon"
              onClick={nextPeriod}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant={view === "day" ? "default" : "outline"}
              onClick={() => setView("day")}
            >
              Day
            </Button>
            <Button
              variant={view === "week" ? "default" : "outline"}
              onClick={() => setView("week")}
            >
              Week
            </Button>
            <Button
              variant={view === "month" ? "default" : "outline"}
              onClick={() => setView("month")}
            >
              Month
            </Button>
          </div>
        </div>
        {view === "month" ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="grid grid-cols-7 gap-px text-xs leading-6 text-center text-gray-500">
              <div>S</div>
              <div>M</div>
              <div>T</div>
              <div>W</div>
              <div>T</div>
              <div>F</div>
              <div>S</div>
            </div>
            <div className="grid grid-cols-7 gap-px flex-1 overflow-y-auto">
              {days.map((day, dayIdx) => (
                <div
                  key={day.toString()}
                  className={cn(
                    "relative min-h-[120px] py-2 px-3 hover:bg-muted/50 cursor-pointer border-b border-r",
                    dayIdx === 0 && colStartClasses[getDay(day)],
                    !isSameMonth(day, currentDate) && "text-muted-foreground",
                    (isEqual(day, selectedDay) || isToday(day)) && "bg-muted/50"
                  )}
                  onClick={() => setSelectedDay(day)}
                >
                  <time
                    dateTime={format(day, "yyyy-MM-dd")}
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full",
                      isToday(day) && "bg-primary text-primary-foreground",
                      isEqual(day, selectedDay) &&
                        !isToday(day) &&
                        "bg-muted-foreground text-muted-foreground-foreground"
                    )}
                  >
                    {format(day, "d")}
                  </time>
                  {filteredEvents
                    .filter((event) => isSameDay(event.start, day))
                    .filter((event, index, self) => 
                      index === self.findIndex((e) => e.id === event.id)
                    )
                    .map((event) => (
                      <EventDisplay
                        key={event.id}
                        event={event}
                        className={cn(
                          "mt-1 px-1 py-0.5 text-xs rounded truncate",
                          event.color,
                          "text-white"
                        )}
                        accounts={accounts}
                        refreshData={refreshData}
                      />
                    ))}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden">
            <div className="grid grid-cols-[auto,1fr] gap-4 h-full">
              <div className="w-16">
                {timeSlots.map((hour) => (
                  <div key={hour} className="text-right pr-2 h-12">
                    {formatTimeToLocal(new Date(Date.UTC(2024, 0, 1, hour)))}
                  </div>
                ))}
              </div>
              <div className="relative">
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {days.map((day) => (
                    <div key={day.toString()} className="text-center font-semibold">
                      {format(day, "EEE")}
                      <br />
                      {format(day, "d")}
                    </div>
                  ))}
                </div>
                <div className="overflow-y-auto max-h-[650px]">
                  {timeSlots.map((hour) => (
                    <div key={hour} className="grid grid-cols-7 gap-2">
                      {days.map((day) => {
                        const localDayStart = startOfDay(day);
                        const utcHour = (hour - new Date().getTimezoneOffset() / 60) % 24;
                        
                        const slotStart = new Date(Date.UTC(
                          localDayStart.getFullYear(),
                          localDayStart.getMonth(),
                          localDayStart.getDate(),
                          utcHour
                        ));
                        const slotEnd = add(slotStart, { hours: 1 });

                        console.log('Local Day:', localDayStart);
                        console.log('UTC Slot Start:', slotStart);
                        console.log('UTC Slot End:', slotEnd);

                        const slotEvents = filteredEvents.filter((event) => {
                          const eventStart = new Date(event.start);
                          const eventEnd = new Date(event.end);
                          
                          const isSameUTCDay = (date1: Date, date2: Date) => {
                            return date1.getUTCDate() === date2.getUTCDate() &&
                                   date1.getUTCMonth() === date2.getUTCMonth() &&
                                   date1.getUTCFullYear() === date2.getUTCFullYear();
                          };

                          return (
                            eventStart < slotEnd &&
                            eventEnd > slotStart &&
                            isSameUTCDay(eventStart, slotStart)
                          );
                        });

                        return (
                          <div
                            key={`${day}-${hour}`}
                            className="relative h-12 border-t"
                          >
                            {slotEvents.map((event) => {
                              const eventStart = new Date(event.start);
                              const eventEnd = new Date(event.end);
                              
                              const startOffset = Math.max(
                                0,
                                (eventStart.getTime() - slotStart.getTime()) / (60 * 60 * 1000)
                              );
                              const duration = (eventEnd.getTime() - eventStart.getTime()) / (60 * 60 * 1000);

                              return (
                                <EventDisplay
                                  key={event.id}
                                  event={event}
                                  className={cn(
                                    "absolute left-0 right-0 z-10",
                                    "rounded px-1 py-0.5 text-xs truncate",
                                    event.color,
                                    "text-white"
                                  )}
                                  style={{
                                    top: `${startOffset * 100}%`,
                                    height: `${duration * 100}%`,
                                    minHeight: '20px'
                                  }}
                                  accounts={accounts}
                                  refreshData={refreshData}
                                />
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const colStartClasses = [
  "",
  "col-start-2",
  "col-start-3",
  "col-start-4",
  "col-start-5",
  "col-start-6",
  "col-start-7",
]

