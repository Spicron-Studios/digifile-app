"use client"

import { Calendar } from "@/app/components/ui/calendar"
import { Account, CalendarEvent } from "@/app/types/calendar"
import { useEffect, useState } from "react"

export default function CalendarPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCalendarData() {
      try {
        const response = await fetch('/api/calendar')
        if (!response.ok) {
          throw new Error('Failed to fetch calendar data')
        }
        const data = await response.json()
        setAccounts(data.accounts)
        setEvents(data.events)
      } catch (error) {
        console.error('Error fetching calendar data:', error)
        setError('Failed to load calendar data.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCalendarData()
  }, [])

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>
  }

  if (error) {
    return <div className="flex items-center justify-center h-full">{error}</div>
  }

  return (
    <div className="container mx-auto py-10">
      <Calendar accounts={accounts} events={events} />
    </div>
  )
}