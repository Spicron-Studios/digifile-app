export interface CalendarEntry {
  Date: string
  Length: string
  Description: string
}

export interface Account {
  AccountID: string
  Name: string
  "Calender-Entries": CalendarEntry[]
}

export type ViewType = "day" | "week" | "month"

export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  accountId: string
  accountName: string
  color: string
}

