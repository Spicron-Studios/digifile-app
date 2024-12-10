"use client"

import { Calendar } from "@/components/ui/calendar"
import { Account, CalendarEvent } from "@/types/calendar"
import { useEffect, useState } from "react"
import { Suspense } from "react"
import { transformEntriesToEvents } from "@/utils/calendar"

function CalendarContent() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchCalendarData() {
      try {
        const response = await fetch('/api/calendar')
        const data = await response.json()
        setAccounts(data.accounts)
        const transformedEvents = await transformEntriesToEvents(data.accounts)
        setEvents(transformedEvents)
      } catch (error) {
        console.error('Failed to fetch calendar data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCalendarData()
  }, [])

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>
  }

  return <Calendar accounts={accounts} events={events} />
}

export default function CalendarPage() {
  return (
    <div className="container mx-auto py-10">
      <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
        <CalendarContent />
      </Suspense>
    </div>
  )
}