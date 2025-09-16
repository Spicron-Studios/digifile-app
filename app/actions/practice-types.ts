'use server';

import db, { practiceTypes } from '@/app/lib/drizzle';
import { isNotNull, asc, and } from 'drizzle-orm';

export type PracticeType = {
  uuid: string;
  codes: string;
  name: string;
};

export async function getPracticeTypes(): Promise<PracticeType[]> {
  const rows = await db
    .select({
      uuid: practiceTypes.uuid,
      codes: practiceTypes.codes,
      name: practiceTypes.name,
    })
    .from(practiceTypes)
    .where(and(isNotNull(practiceTypes.codes), isNotNull(practiceTypes.name)))
    .orderBy(asc(practiceTypes.name));

  return rows.map(r => ({
    uuid: r.uuid,
    codes: r.codes ?? '',
    name: r.name ?? '',
  }));
}
