export interface CalendarEntry {
  startdate: string
  length: string
  description: string
}

export interface Account {
  AccountID: string
  Name: string
  "Calendar-Entries": CalendarEntry[]
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

