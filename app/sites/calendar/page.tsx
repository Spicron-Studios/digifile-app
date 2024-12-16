"use client"

import { Calendar } from "@/app/components/ui/calendar"
import { Account, CalendarEvent } from "@/app/types/calendar"
import { useEffect, useState, useCallback } from "react"

export default function CalendarPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCalendarData = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/calendar')
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch calendar data')
      }
      setAccounts(data.accounts)
      setEvents(data.events)
    } catch (error) {
      console.error('Error fetching calendar data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load calendar data.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCalendarData()
  }, [fetchCalendarData])

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>
  }

  if (error) {
    return <div className="flex items-center justify-center h-full text-red-500">{error}</div>
  }

  return (
    <div className="container mx-auto py-10">
      <Calendar accounts={accounts} events={events} refreshData={fetchCalendarData} />
    </div>
  )
}