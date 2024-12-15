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
        console.log('Fetching calendar data...')
        const response = await fetch('/api/calendar')
        
        const data = await response.json()
        
        if (!response.ok) {
          // Handle specific error types
          switch(data.type) {
            case 'NO_USERS':
              throw new Error('No active users found in the system')
            case 'NO_ENTRIES':
              throw new Error('No calendar entries found for active users')
            default:
              throw new Error(data.error || 'Failed to fetch calendar data')
          }
        }

        console.log('Calendar data received:', data)
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