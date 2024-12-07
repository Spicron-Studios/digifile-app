"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  add,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isEqual,
  isSameDay,
  isSameMonth,
  isToday,
  parse,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfToday,
  startOfWeek,
} from "date-fns"
import { Account, CalendarEvent, ViewType } from "@/types/calendar"
import { Button } from "@/components/ui/button"
import { AccountSelector } from "./account-selector"
import { cn } from "@/lib/utils"

interface CalendarProps {
  accounts: Account[]
  events: CalendarEvent[]
}

export function Calendar({ accounts, events }: CalendarProps) {
  const today = startOfToday()
  const [selectedDay, setSelectedDay] = React.useState(today)
  const [currentDate, setCurrentDate] = React.useState(today)
  const [view, setView] = React.useState<ViewType>("month")
  const [selectedAccounts, setSelectedAccounts] = React.useState<string[]>(accounts.map(account => account.AccountID))

  function previousPeriod() {
    setCurrentDate((prev) => {
      switch (view) {
        case "day":
          return add(prev, { days: -1 })
        case "week":
          return add(prev, { weeks: -1 })
        case "month":
          return add(prev, { months: -1 })
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
    <div className="p-4">
      <div className="space-y-4">
        <AccountSelector
          accounts={accounts}
          selectedAccounts={selectedAccounts}
          onToggleAccount={toggleAccount}
          onAddAccount={(account) => toggleAccount(account.AccountID)}
        />
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
          <>
            <div className="grid grid-cols-7 gap-px mt-2 text-xs leading-6 text-center text-gray-500">
              <div>S</div>
              <div>M</div>
              <div>T</div>
              <div>W</div>
              <div>T</div>
              <div>F</div>
              <div>S</div>
            </div>
            <div className="grid grid-cols-7 gap-px mt-2 text-sm">
              {days.map((day, dayIdx) => (
                <div
                  key={day.toString()}
                  className={cn(
                    "relative py-2 px-3 hover:bg-muted/50 cursor-pointer",
                    dayIdx === 0 && colStartClasses[getDay(day)],
                    !isSameMonth(day, currentDate) && "text-muted-foreground",
                    (isEqual(day, selectedDay) || isToday(day)) &&
                      "bg-muted/50"
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
                      <div
                        key={event.id}
                        className={cn(
                          "mt-1 px-1 py-0.5 text-xs rounded truncate",
                          event.color,
                          "text-white"
                        )}
                      >
                        {event.title}
                      </div>
                    ))}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="mt-4">
            <div className="grid grid-cols-[auto,1fr] gap-4">
              <div className="w-16"></div>
              <div className="grid grid-cols-7 gap-2">
                {days.map((day) => (
                  <div key={day.toString()} className="text-center font-semibold">
                    {format(day, "EEE")}
                    <br />
                    {format(day, "d")}
                  </div>
                ))}
              </div>
              {timeSlots.map((hour) => (
                <React.Fragment key={hour}>
                  <div className="text-right pr-2 py-2">{format(new Date().setHours(hour), "ha")}</div>
                  <div className="grid grid-cols-7 gap-2">
                    {days.map((day) => {
                      const start = new Date(day).setHours(hour)
                      const end = add(new Date(start), { hours: 1 })
                      // Get unique events for this time slot
                      const uniqueEvents = Array.from(
                        new Map(
                          filteredEvents
                            .filter((event) => {
                              const eventStart = event.start
                              const eventEnd = event.end
                              return eventStart < new Date(end) && eventEnd > new Date(start)
                            })
                            .map(event => [event.id, event])
                        ).values()
                      )

                      return (
                        <div key={day.toString()} className="relative h-12 border-t">
                          {uniqueEvents.map((event) => (
                            <div
                              key={event.id}
                              className={cn(
                                "absolute left-0 right-0 rounded px-1 py-0.5 text-xs truncate",
                                event.color,
                                "text-white"
                              )}
                              style={{
                                top: `${((event.start.getTime() - start) / (60 * 60 * 1000)) * 100}%`,
                                height: `${((event.end.getTime() - event.start.getTime()) / (60 * 60 * 1000)) * 100}%`,
                              }}
                            >
                              {event.title}
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                </React.Fragment>
              ))}
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

