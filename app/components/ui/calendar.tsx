"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, RefreshCcw } from 'lucide-react'
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
  selectedAccounts: string[]
  onToggleAccount: (accountId: string) => void
}

interface EventDisplayProps {
  event: CalendarEvent
  className?: string
  accounts: Account[]
  refreshData: () => void
  style?: React.CSSProperties
}

const EventDisplay = ({ event, className, accounts, refreshData, style }: EventDisplayProps) => {
  const [showModal, setShowModal] = useState(false)
  const eventStart = new Date(event.start)
  const eventEnd = new Date(event.end)
  
  // Calculate duration in hours for proper sizing
  const durationHours = (eventEnd.getTime() - eventStart.getTime()) / (1000 * 60 * 60)
  const startHour = eventStart.getHours() + (eventStart.getMinutes() / 60)
  
  const eventStyle = {
    ...style,
    top: `${startHour * 48}px`, // 48px is the height of each hour slot
    height: `${durationHours * 48}px`,
    position: 'absolute',
    width: '95%',
    zIndex: 10
  }

  return (
    <>
      <div
        className={cn(
          `${event.color}`,
          "px-2 rounded-md truncate",
          "text-xs font-medium text-white",
          "hover:opacity-90 cursor-pointer",
          className
        )}
        style={eventStyle}
        title={`${event.accountName}: ${event.title}\n${format(eventStart, 'HH:mm')} - ${format(eventEnd, 'HH:mm')}`}
        onClick={(e) => {
          e.stopPropagation()
          setShowModal(true)
        }}
      >
        <div className="truncate">
          {format(eventStart, 'HH:mm')} - {event.title}
        </div>
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

export function Calendar({ accounts, events, refreshData, hasAdminAccess, defaultSelectedAccount, selectedAccounts, onToggleAccount }: CalendarProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const today = startOfToday()
  const [selectedDay, setSelectedDay] = React.useState(today)
  const [currentDate, setCurrentDate] = React.useState(today)
  const [view, setView] = React.useState<ViewType>("month")

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

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshData()
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className="p-4 h-[800px] flex flex-col">
      <div className="space-y-4">
        <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center space-x-4">
            <AccountSelector
              accounts={accounts}
              selectedAccounts={selectedAccounts}
              onToggleAccount={onToggleAccount}
              onAddAccount={(account) => onToggleAccount(account.AccountID)}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              className="hover:bg-gray-50"
              disabled={isRefreshing}
            >
              <RefreshCcw className={cn(
                "h-4 w-4",
                isRefreshing && "animate-spin"
              )} />
            </Button>
          </div>
          <div className="flex gap-2">
            <AppointmentModal accounts={accounts} onAppointmentAdded={handleRefresh} />
          </div>
        </div>

        <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={previousPeriod}
              className="hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2 className="text-lg font-semibold text-gray-800">
              {format(currentDate, view === "day" ? "MMMM d, yyyy" : "MMMM yyyy")}
            </h2>
            <Button
              variant="outline"
              size="icon"
              onClick={nextPeriod}
              className="hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-2 bg-gray-100 p-1 rounded-md">
            <Button
              variant={view === "day" ? "default" : "ghost"}
              onClick={() => setView("day")}
              className="h-8"
            >
              Day
            </Button>
            <Button
              variant={view === "week" ? "default" : "ghost"}
              onClick={() => setView("week")}
              className="h-8"
            >
              Week
            </Button>
            <Button
              variant={view === "month" ? "default" : "ghost"}
              onClick={() => setView("month")}
              className="h-8"
            >
              Month
            </Button>
          </div>
        </div>
        {view === "month" ? (
          <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-lg shadow-sm">
            <div className="grid grid-cols-7 gap-px text-sm font-medium text-gray-600 bg-gray-50 border-b">
              <div className="p-2 text-center">Sun</div>
              <div className="p-2 text-center">Mon</div>
              <div className="p-2 text-center">Tue</div>
              <div className="p-2 text-center">Wed</div>
              <div className="p-2 text-center">Thu</div>
              <div className="p-2 text-center">Fri</div>
              <div className="p-2 text-center">Sat</div>
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
                    {format(new Date(2024, 0, 1, hour), 'HH:mm')}
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
                <div className="grid grid-cols-7 gap-2">
                  {days.map((day) => (
                    <div key={day.toString()} className="relative" style={{ height: `${24 * 48}px` }}>
                      {timeSlots.map((hour) => (
                        <div
                          key={hour}
                          className="absolute w-full border-t border-gray-200"
                          style={{ top: `${hour * 48}px`, height: '48px' }}
                        />
                      ))}
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

