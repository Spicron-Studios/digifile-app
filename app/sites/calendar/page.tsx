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
        const contentType = response.headers.get("content-type")
        
        if (!contentType?.includes("application/json")) {
          throw new Error('Received non-JSON response from server')
        }

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to fetch calendar data')
        }

        const data = await response.json()
        setAccounts(data.accounts)
        setEvents(data.events)
      } catch (error) {
        console.error('Error fetching calendar data:', error)
        setError(error instanceof Error ? error.message : 'Failed to load calendar data.')
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
    return <div className="flex items-center justify-center h-full text-red-500">{error}</div>
  }

  return (
    <div className="container mx-auto py-10">
      <Calendar accounts={accounts} events={events} />
    </div>
  )
}