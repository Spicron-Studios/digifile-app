
import { transformEntriesToEvents } from "@/utils/calendar"
import { accounts } from "@/data/accounts"

export default function CalendarPage() {
  const events = transformEntriesToEvents(accounts)

  return (
    <div className="container mx-auto py-10">
      <Calendar accounts={accounts} events={events} />
    </div>
  )
}

