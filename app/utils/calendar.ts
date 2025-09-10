import { Account, CalendarEvent } from '@/app/types/calendar';
import { Logger } from '@/app/lib/logger';

const logger = Logger.getInstance();
logger.init().catch(console.error);

export async function transformEntriesToEvents(
  accounts: Account[]
): Promise<CalendarEvent[]> {
  await logger.info(
    'calendar.ts',
    `Transforming entries for ${accounts.length} accounts`
  );

  try {
    const events: CalendarEvent[] = [];
    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i];

      if (!account) continue;

      await logger.debug(
        'calendar.ts',
        `Processing account ${account.Name} (${account.AccountID})`
      );

      for (const entry of account['Calendar-Entries']) {
        const start = new Date(entry.startdate);
        const end = new Date(entry.enddate);

        // Check if dates are valid
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          await logger.warn(
            'calendar.ts',
            `Invalid date in entry ${entry.uid}`
          );
          continue;
        }

        await logger.debug(
          'calendar.ts',
          `Creating event for entry UID: ${entry.uid}`
        );

        events.push({
          id: entry.uid,
          title: entry.title,
          start,
          end,
          accountId: account.AccountID,
          accountName: account.Name,
          color: account.color,
          description: entry.description,
        });
      }
    }

    return events;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logger.error(
      'calendar.ts',
      `Error transforming calendar entries: ${errorMessage}`
    );
    throw error;
  }
}
