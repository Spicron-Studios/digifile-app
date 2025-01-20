"use client"

import { Calendar } from "@/app/components/ui/calendar"
import { Account, CalendarEvent } from "@/app/types/calendar"
import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"

export default function CalendarPage() {
  const { data: session } = useSession()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const hasAdminAccess = session?.user?.roles?.some(r => 
    r.role.name.toLowerCase() === 'admin' || 
    r.role.name.toLowerCase() === 'organizer'
  )

  const fetchCalendarData = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/calendar', {
        headers: {
          'Content-Type': 'application/json',
        }
      })
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch calendar data')
      }
      
      // Only set the current user's account as selected by default
      const currentUserAccount = data.accounts.find(
        (account: Account) => account.AccountID === session?.user?.id
      )
      
      setAccounts(data.accounts)
      setEvents(data.events.filter((event: CalendarEvent) => 
        event.accountId === session?.user?.id
      ))
    } catch (error) {
      console.error('Error fetching calendar data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load calendar data.')
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.id])

  useEffect(() => {
    if (session?.user) {
      fetchCalendarData()
    }
  }, [fetchCalendarData, session?.user])

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>
  }

  if (error) {
    return <div className="flex items-center justify-center h-full text-red-500">{error}</div>
  }

  return (
    <div className="container mx-auto py-10">
      <Calendar 
        accounts={accounts} 
        events={events} 
        refreshData={fetchCalendarData}
        hasAdminAccess={hasAdminAccess}
        defaultSelectedAccount={session?.user?.id}
      />
    </div>
  )
}