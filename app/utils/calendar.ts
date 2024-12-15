import { Account, CalendarEvent } from "@/app/types/calendar"
import { Logger } from "@/app/lib/logger"

const logger = Logger.getInstance();
logger.init().catch(console.error);

export async function transformEntriesToEvents(accounts: Account[]): Promise<CalendarEvent[]> {
  if (typeof window === 'undefined') {
    await logger.info("calendar.ts", `Transforming entries for ${accounts.length} accounts`);
  } else {
    console.log(`Transforming entries for ${accounts.length} accounts`);
  }
  
  try {
    const events = [];
    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i];
      
      console.log(`Account ${account.Name} (${account.AccountID}) assigned color: ${account.color}`);

      for (const entry of account["Calender-Entries"]) {
        const start = new Date(entry.Date);
        const end = new Date(start.getTime() + parseInt(entry.Length) * 60000);

        if (typeof window === 'undefined') {
          await logger.debug(
            "calendar.ts",
            `Creating event for account ${account.AccountID}: ${entry.Description}`
          );
        } else {
          console.log(`Creating event for account ${account.AccountID}: ${entry.Description}`);
        }

        events.push({
          id: `${account.AccountID}-${start.getTime()}`,
          title: entry.Description,
          start,
          end,
          accountId: account.AccountID,
          accountName: account.Name,
          color: account.color,
        });
      }
    }
    console.log('Transformed events:', events);
    return events;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (typeof window === 'undefined') {
      await logger.error("calendar.ts", `Error transforming calendar entries: ${errorMessage}`);
    } else {
      console.error(`Error transforming calendar entries: ${errorMessage}`);
    }
    throw error;
  }
}
