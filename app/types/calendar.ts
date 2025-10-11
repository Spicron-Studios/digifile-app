export interface Account {
  uid: string;
  name: string;
  color: string;
}

export interface CalendarEntry {
  uid: string;
  userUid: string;
  startdate: string; // ISO string
  enddate: string; // ISO string
  title: string;
  description?: string | null;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resourceId: string; // user uid
  color: string;
  description?: string | null;
}

export const DEFAULT_ACCOUNT_COLORS: string[] = [
  '#ef4444', // red-500
  '#3b82f6', // blue-500
  '#22c55e', // green-500
  '#a855f7', // purple-500
  '#f97316', // orange-500
  '#eab308', // yellow-500
  '#14b8a6', // teal-500
  '#f43f5e', // rose-500
  '#06b6d4', // cyan-500
  '#8b5cf6', // violet-500
];

export function colorForIndex(index: number): string {
  const paletteLength: number = DEFAULT_ACCOUNT_COLORS.length;
  if (paletteLength === 0) return '#3b82f6';
  const normalized: number = Math.abs(index) % paletteLength;
  return DEFAULT_ACCOUNT_COLORS[normalized] ?? '#3b82f6';
}
