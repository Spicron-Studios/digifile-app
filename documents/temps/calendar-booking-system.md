## DigiFile Calendar Booking System – Architecture & Working Dossier

### Purpose

This dossier documents the current calendar/appointments system: data sources, database tables, server logic, UI components, permissions, and technologies. It also highlights gaps vs intended behavior and outlines extension points (e.g., doctor templates and per‑doctor colors).

### High‑level Summary

- The calendar shows appointments for one or more users (doctors/staff) in day/week/month views using `react-big-calendar` with `moment` localizer.
- Appointments are stored in a dedicated table `user_calendar_entries` and scoped by organization (`orgid`) and `active=true`.
- Data is assembled server-side via `getCalendarData()` and passed to a client `CalendarClient` that renders the big calendar, account selector, and appointment modal.
- Create/update/delete of appointments is handled by Server Actions in `app/actions/appointments.ts` (soft delete via `active=false`).
- Admins/Organizers can view multiple users; non-admins/non-organizers see only their own entries.

---

### Data Sources and Persistence

- Primary table: `db/schema.ts` → `user_calendar_entries`
  - Columns (simplified):
    - `uid` (uuid, PK)
    - `userUid` (uuid → `users.uid`)
    - `startdate` (timestamp string)
    - `enddate` (timestamp string)
    - `title` (varchar)
    - `description` (varchar, optional)
    - `length` (integer, not actively used)
    - `active` (boolean) – soft delete flag
    - `dateCreated` (timestamp string)
    - `lastEdit` (timestamp string)
    - `locked` (boolean)
    - `orgid` (uuid → `organization_info.uid`)
- Related tables used by calendar assembly:
  - `users` (for the list of selectable accounts/doctors and display names)
  - `organization_info` (for org scoping)

Organization and roles

- All reads/writes include `orgid` filtering based on the signed-in user’s session.
- Role checks determine visibility:
  - Admin/Organizer: can see multiple/all users’ calendars in the org.
  - Others: restricted to their own `users.uid`.

Timezone

- The system standardizes on `Africa/Johannesburg` (`moment-timezone`) for both client and server transformations of dates.

---

### Server Logic and APIs

- Calendar data assembly: `app/actions/calendar.ts`
  - `getCalendarData()`
    - Authenticates and loads users for the org (role-aware filtering).
    - Queries `user_calendar_entries` where `active=true` and `orgid=session.user.orgId` and `userUid ∈ [selected users]`.
    - Maps DB rows into `Account` objects and flattens into `CalendarEvent[]` for the UI.
    - Assigns a color per account from a predefined palette.

- Appointments CRUD (Server Actions): `app/actions/appointments.ts`
  - `addAppointment(data)`
  - `updateAppointment(id, data)`
  - `deleteAppointment(id)` – soft delete (`active=false`).
  - Shared validations via `zod`; date coercion via `moment.tz(..., 'Africa/Johannesburg').toISOString()`.
  - All writes include the caller’s `orgId` from session.

- Legacy/auxiliary API route: `app/api/appointments/route.ts`
  - POST inserts into `user_calendar_entries`, but currently sets `orgid: null` (likely legacy or not in active use). Prefer server actions above for authenticated, org‑scoped behavior.

---

### UI Components and Pages

- Page entry: `app/(main)/sites/calendar/page.tsx`
  - Server component: reads session, checks `hasAdminAccess`, calls `getCalendarData()`, and renders `CalendarClient` with `accounts`, `events`, and role flags.

- Client container: `app/(main)/sites/calendar/CalendarClient.tsx`
  - Manages selected accounts (defaulting to the signed‑in user or first account).
  - Passes data and selection to the presentational `Calendar` component.

- Presentational wrapper: `app/components/ui/calendar.tsx`
  - Thin wrapper over `BigCalendar` with the same props.

- Calendar view: `app/components/ui/big-calendar.tsx`
  - Uses `react-big-calendar` with `momentLocalizer` for day/week/month.
  - Toolbar: navigation, view toggles, refresh, `AccountSelector`, and `AppointmentModal`.
  - Filters events by selected accounts; custom event tiles and headers.
  - Note: event coloring uses per‑account colors from `getCalendarData()`.

- Account selection UI:
  - `app/components/ui/account-selector/account-selector.tsx`
  - `app/components/ui/account-selector/account-list.tsx`
  - `app/components/ui/account-selector/account-chip.tsx`

- Appointment modal: `app/components/ui/appointment/appointment-modal.tsx`
  - Form with `zod` + `react-hook-form`.
  - Fields: user (doctor), start date/time, end date/time, title, description.
  - Calls server actions `addAppointment`/`updateAppointment`/`deleteAppointment`.
  - Honors `hasAdminAccess` for destructive actions.
  - Uses `DateTimePicker` (`app/components/ui/date-time-picker.tsx`).

- Types for calendar: `app/types/calendar.ts`
  - `Account`, `CalendarEntry`, `CalendarEvent` interfaces used throughout the stack.

---

### Data Flow (Create/Update/Delete)

1. User opens Calendar page → server loads `accounts` and `events` via `getCalendarData()`.
2. Client selects one or more accounts (doctors) to view.
3. User clicks “Add Appointment” in the toolbar (or opens an existing event in future enhancement):
   - Fills user/doctor, start, end, title, description in `AppointmentModal`.
   - On submit, the modal converts dates to SA time and calls the corresponding server action.
4. Server action validates, writes to `user_calendar_entries` with `orgid` and timestamps.
5. UI triggers `router.refresh()`; the page re‑executes `getCalendarData()` and re‑renders with updated events.

---

### Current Capabilities vs Intended Behavior

- Implemented today
  - Multi‑doctor calendar view with selectable accounts.
  - Create/Update/Delete appointments per doctor (`userUid`), with title/description.
  - Org‑scoped data isolation; admin/organizer elevated visibility.
  - Day/Week/Month views; standardized SA timezone handling.

- Not yet implemented (based on requirements)
  - Link an appointment to a specific patient/person. The DB model and modal currently only capture doctor (`userUid`), not patient.
  - Stable per‑doctor colors configured in the database. Colors are assigned at runtime in `getCalendarData()` from a palette; they are not persisted per user.
  - Practice templates/working hours per doctor (e.g., availability templates, operating times).
  - Overlap/conflict detection for double‑booking.
  - Drag‑and‑drop or resize to reschedule events; recurring appointments.

Known gaps/technical notes

- Coloring: `getCalendarData()` assigns Tailwind class strings (e.g., `bg-blue-500`) as colors, but `react-big-calendar` event styling in `big-calendar.tsx` sometimes sets `style={{ backgroundColor: eventColor }}` where `eventColor` is a class name, not a hex/RGB value. This should be normalized (e.g., map to hex) or applied as a class instead of inline style.
- Refresh: `CalendarClient`’s `refreshData` prop is currently a no‑op; the modal uses `router.refresh()` which re‑fetches server props. Consider consolidating to an explicit re‑fetch flow for clarity.
- Legacy route: `app/api/appointments/route.ts` writes with `orgid: null`; prefer Server Actions for correct scoping, or update/remove the route to avoid confusion.

---

### Technology Stack

- Next.js App Router (server + client components)
- React + TypeScript
- Drizzle ORM (PostgreSQL)
- `react-big-calendar` (calendar UI)
- `moment` + `moment-timezone` (localization & time math)
- `zod` + `react-hook-form` (form validation)
- Tailwind CSS + shadcn/ui components
- Custom `Logger` service

---

### Files of Interest (by layer)

- Page & client container
  - `app/(main)/sites/calendar/page.tsx`
  - `app/(main)/sites/calendar/CalendarClient.tsx`

- UI components
  - `app/components/ui/calendar.tsx`
  - `app/components/ui/big-calendar.tsx`
  - `app/components/ui/account-selector/*`
  - `app/components/ui/appointment/appointment-modal.tsx`
  - `app/components/ui/date-time-picker.tsx`

- Server actions & utils
  - `app/actions/calendar.ts` (read/assembly)
  - `app/actions/appointments.ts` (CUD)
  - `app/utils/calendar.ts` (auxiliary transforms; not central)

- API route (legacy/auxiliary)
  - `app/api/appointments/route.ts` (POST)

- Database schema
  - `db/schema.ts` → `user_calendar_entries`, `users`, and their relations

---

### How the System Should Work (aligned with requirements)

- Roles: Head practitioner/Receptionist/Admin can view multiple doctors and quickly spot openings. Doctors can view their own schedule; Admin/Organizer may manage others’ schedules.
- Booking: From the calendar toolbar, a user can create an appointment specifying:
  - Doctor (`userUid`), start/end times, title, description
  - Future: also select patient (link to patient/file), reason, and tags.
- Visibility: Day view should aggregate all selected doctors (e.g., 10+ doctors) for a single day to spot gaps.
- Colors: Each doctor should have a distinctive, consistent color across sessions and devices; preferably persisted to the user profile or a dedicated table.
- Templates (future): Practice can define per‑doctor templates/availability (e.g., clinic hours). The UI should grey out or block out unavailable slots and allow quick slot booking.

---

### Recommended Next Steps (Implementation Outline)

1. Patient linkage
   - DB: Add `patientId` (→ `patient.uid`) to `user_calendar_entries` or create a join table if many‑to‑one needed.
   - UI: Extend `AppointmentModal` to select a patient (search by name/ID) and store link.
2. Persisted per‑doctor colors
   - DB: Add `calendarColor` to `users` or a `user_preferences` table.
   - Server: Read stored color; fallback to palette when missing; remove inline Tailwind class usage in favor of CSS variables or hex values.
3. Availability templates
   - DB: Add `doctor_availability_templates` with rules (day of week, start/end, exceptions).
   - UI: Visualize availability and restrict/validate booking within allowed slots.
4. Conflict detection & UX
   - Prevent overlapping bookings per doctor; surface warnings in the modal.
   - Optional drag‑and‑drop for rescheduling and duration resizing.
5. API/Actions cleanup
   - Remove or fix `app/api/appointments/route.ts` to enforce `orgid` and auth, or rely solely on Server Actions.

---

### Reference Snippets

```app/(main)/sites/calendar/page.tsx
export default async function CalendarPage(): Promise<React.JSX.Element> {
  const session = await auth();
  const hasAdminAccess = !!session?.user?.roles?.some(
    r => r.role.name.toLowerCase() === 'admin' || r.role.name.toLowerCase() === 'organizer'
  );
  const { accounts, events } = await getCalendarData();
  return (
    <CalendarClient accounts={accounts} events={events} hasAdminAccess={hasAdminAccess} defaultSelectedAccount={session?.user?.id} />
  );
}
```

```app/actions/calendar.ts
const userCalendarEntriesList = await db
  .select({
    uid: userCalendarEntries.uid,
    user_uid: userCalendarEntries.userUid,
    startdate: userCalendarEntries.startdate,
    enddate: userCalendarEntries.enddate,
    description: userCalendarEntries.description,
    title: userCalendarEntries.title,
  })
  .from(userCalendarEntries)
  .where(and(
    eq(userCalendarEntries.active, true),
    eq(userCalendarEntries.orgid, session.user.orgId),
    inArray(userCalendarEntries.userUid, userList.map(u => u.uid))
  ));
```

```db/schema.ts
export const userCalendarEntries = pgTable('user_calendar_entries', {
  uid: uuid().primaryKey().notNull(),
  userUid: uuid('user_uid'),
  startdate: timestamp({ precision: 6, mode: 'string' }),
  enddate: timestamp({ precision: 6, mode: 'string' }),
  title: varchar({ length: 255 }),
  description: varchar({ length: 255 }),
  active: boolean(),
  dateCreated: timestamp('date_created', { precision: 6, mode: 'string' }),
  lastEdit: timestamp('last_edit', { precision: 6, mode: 'string' }),
  locked: boolean(),
  orgid: uuid(),
  length: integer(),
});
```
