export interface CalendarEntry {
  uid: string
  startdate: string
  enddate: string
  title: string
  length: string
  description: string
}

export interface Account {
  AccountID: string
  Name: string
  "Calendar-Entries": CalendarEntry[]
  color: string
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
  description?: string
}

