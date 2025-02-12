"use client"

import { Calendar } from "@/app/components/ui/calendar"
import { Account, CalendarEvent } from "@/app/types/calendar"
import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"

export default function CalendarPage() {
  const { data: session } = useSession()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Ensure hasAdminAccess is always a boolean
  const hasAdminAccess = !!session?.user?.roles?.some(r =>
    r.role.name.toLowerCase() === "admin" ||
    r.role.name.toLowerCase() === "organizer"
  )

  const fetchCalendarData = useCallback(async () => {
    try {
      const response = await fetch("/api/calendar", {
        headers: {
          "Content-Type": "application/json",
        },
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch calendar data")
      }

      setAccounts(data.accounts)
      setEvents(data.events)
    } catch (error) {
      console.error("Error fetching calendar data:", error)
      setError(error instanceof Error ? error.message : "Failed to load calendar data.")
      throw error
    }
  }, [])

  // Initial load
  useEffect(() => {
    const initializeCalendar = async () => {
      setIsLoading(true)
      try {
        if (session?.user?.id) {
          setSelectedAccounts([session.user.id])
          await fetchCalendarData()
        }
      } catch (error) {
        console.error("Error initializing calendar:", error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeCalendar()
  }, [session?.user?.id, fetchCalendarData])

  const handleAccountToggle = (accountId: string) => {
    setSelectedAccounts((current) =>
      current.includes(accountId)
        ? current.filter((id) => id !== accountId)
        : [...current, accountId]
    )
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>
  }

  if (error) {
    return <div className="flex items-center justify-center h-full text-red-500">{error}</div>
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="bg-gray-50 rounded-xl p-6">
        <Calendar
          accounts={accounts}
          events={events}
          refreshData={fetchCalendarData}
          hasAdminAccess={hasAdminAccess}
          defaultSelectedAccount={session?.user?.id}
          selectedAccounts={selectedAccounts}
          onToggleAccount={handleAccountToggle}
        />
      </div>
    </div>
  )
}