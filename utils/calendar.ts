import { Account, CalendarEvent } from "@/types/calendar"

const COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-yellow-500",
  "bg-red-500",
]

export function getAccountColor(index: number): string {
  return COLORS[index % COLORS.length]
}

export function transformEntriesToEvents(accounts: Account[]): CalendarEvent[] {
  return accounts.flatMap((account, accountIndex) =>
    account["Calender-Entries"].map((entry) => {
      const start = new Date(entry.Date)
      const end = new Date(start.getTime() + parseInt(entry.Length) * 60000)

      return {
        id: `${account.AccountID}-${start.getTime()}`,
        title: entry.Description,
        start,
        end,
        accountId: account.AccountID,
        accountName: account.Name,
        color: getAccountColor(accountIndex),
      }
    })
  )
}

