import { Account, CalendarEvent } from "@/app/types/calendar"
import { Logger } from "@/app/lib/logger"

const logger = Logger.getInstance();
logger.init().catch(console.error);

export async function transformEntriesToEvents(accounts: Account[]): Promise<CalendarEvent[]> {
  await logger.info("calendar.ts", `Transforming entries for ${accounts.length} accounts`);
  
  try {
    const events = [];
    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i];
      
      await logger.debug("calendar.ts", 
        `Processing account ${account.Name} (${account.AccountID})`
      );

      for (const entry of account["Calender-Entries"]) {
        const start = new Date(entry.Date);
        const end = new Date(start.getTime() + parseInt(entry.Length) * 60000);

        await logger.debug(
          "calendar.ts",
          `Creating event for entry UID: ${entry.uid}`
        );

        events.push({
          id: entry.uid,
          title: entry.Description,
          start,
          end,
          accountId: account.AccountID,
          accountName: account.Name,
          color: account.color,
          description: entry.Description
        });
      }
    }
    
    return events;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logger.error("calendar.ts", 
      `Error transforming calendar entries: ${errorMessage}`
    );
    throw error;
  }
}
