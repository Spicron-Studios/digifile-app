# Calendar Process Documentation

## 1. Introduction

This document is the single source of truth for how the Calendar in DigiFile works. It explains core concepts, data flow, server actions, primary UI components, and the database model so that any developer or AI agent can add features or fix bugs with confidence.

## 2. Core Concepts

### Accounts (Doctors) vs. Calendar Events

- **Account**: A person/resource that can hold appointments. In our UI this represents a doctor. Accounts are rendered as calendar "resources" and each has a color.
- **Calendar Event**: A scheduled appointment belonging to one account/doctor. Events carry a title, optional description, a start/end time, a `resourceId` matching the doctor’s `uid`, and a color used for styling.

### Views and Scope

- The calendar currently focuses on a **Day view** with a mini-month selector for quick navigation.
- Users can toggle which doctors to display; events render per selected doctor as side-by-side resource columns.

### Interaction Model

- Click/drag on an empty time slot opens the booking modal prefilled with date and times.
- Events can be selected to edit; they can be dragged to another time or to a different doctor, and resized to change duration.
- Hovering an event shows a tooltip with the full title, time range, and description.

### Colors and Theming

- Each account has an assigned color. Event backgrounds are a translucent version of the color for readability. Core tokens are defined in `app/globals.css` under calendar custom properties.

## 3. Types

Defined in `app/types/calendar.ts`:

```ts
export interface Account {
  uid: string;
  name: string;
  color: string;
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
```

Also available: `DEFAULT_ACCOUNT_COLORS` and `colorForIndex()` for deterministic color assignment.

## 4. User Workflows & Use Cases

### A. Book an Appointment

1. User clicks any empty slot or the "Book Appointment" button.
2. `AppointmentModal` opens with date/time prefilled. Times are selected in 15‑minute increments using Google‑style dropdowns.
3. User chooses the doctor, start and end, title and optional description.
4. On Save, the client calls `addAppointment` (server action) and then refreshes the current day via `getDayEvents`.

### B. Edit / Move / Resize an Appointment

1. User clicks an event to open `AppointmentModal` and update details, or
2. User drags the event to a new time or different doctor; or resizes to change duration.
3. Client calls `updateAppointment` with the new `start`, `end`, and `userUid` (doctor). After success, it refreshes the day.

### C. Delete an Appointment

1. In `AppointmentModal`, user clicks Delete.
2. Client calls `deleteAppointment` (soft delete). After success, it refreshes the day.

### D. Navigate and Refresh

- Selecting a date in the mini calendar, changing selected doctors, or clicking the **Refresh** button will reload events for that day and doctor set.

## 5. Technical Deep Dive

### Data Loading

- Initial page load (`app/(main)/sites/calendar/page.tsx`) calls `getCalendarData()`:
  - Loads active org users as accounts (with deterministic colors).
  - Loads events for visible users and maps DB rows to `CalendarEvent` objects.
- Day‑scoped loading uses `getDayEvents(dateISO, userIds)` to fetch events for the selected day. Events are included if they intersect the day (start ≤ endOfDay AND end ≥ startOfDay). This supports events spanning midnight or starting before the day.

### Server Actions

- `app/actions/calendar.ts`
  - `getCalendarData(selectedUserIds?)`: initial accounts + events.
  - `getDayEvents(dateISO, userIds)`: returns `CalendarEvent[]` for a specific day and selected doctors. Includes console logging for diagnostics.
- `app/actions/appointments.ts`
  - `addAppointment(input)`
  - `updateAppointment(id, input)`
  - `deleteAppointment(id)`

All server actions scope by `orgId` via `auth()`; only active records are returned.

### Client Container

- `app/(main)/sites/calendar/CalendarClient.tsx` owns the interactive state:
  - `selectedIds`: doctor UIDs to display (initially all accounts).
  - `currentDate`: the focused day.
  - `visibleEvents`: what the calendar renders. It is set by calling `getDayEvents()` when date/selection changes or when the user clicks Refresh. If the server returns zero results, the client falls back to the preloaded events filtered in-memory for resiliency.
  - `refreshDay()`: helper that fetches day data and applies the fallback when needed. Includes console logging for visibility.
  - Drag/Resize handlers call `updateAppointment()` and then `refreshDay()`.
  - Create/Delete flows also call `refreshDay()` after server success.

### Calendar Rendering

- `app/components/ui/big-calendar.tsx` wraps `react-big-calendar` with the DnD addon:
  - `withDragAndDrop` provides `onEventDrop` and `onEventResize` hooks.
  - `resourceIdAccessor="id"`, `resourceTitleAccessor="title"`, and `resourceAccessor="resourceId"` enable multi‑doctor columns.
  - `dayLayoutAlgorithm="no-overlap"` renders concurrent events side‑by‑side.
  - `step=30`, `timeslots=2` → 30‑minute slot grid.
  - Custom `components.event` renders title in the tile and a hover tooltip with the time range and description.
  - `eventPropGetter` styles events using the account color with readable contrast and rounded cards.

### Controls & Selectors

- `AccountSelector` provides chip‑style toggles for doctors; updates `selectedIds`.
- `AppointmentModal` uses `Select` pickers with 15‑minute increments (05:00–20:00) for start and end times.
- A **Refresh** button triggers `refreshDay()`.

### Styling & Theming

- `app/globals.css` defines calendar CSS custom properties and overrides for `react-big-calendar`:
  - Alternating slot banding, subtle grid lines, visible current‑time line.
  - Rounded event cards, inset outline, and small margins for clearer separation of overlapping events.

### Logging & Diagnostics

- Server side: `getDayEvents` logs authorization state, DB row count, and filtered count for the selected day.
- Client side: `CalendarClient` logs refresh triggers, selected doctor IDs, server counts, and fallback counts.

## 6. Database Schema Overview

Relevant tables in `db/schema.ts`:

- `users`
  - Doctors (and other users) within an organization. Filtered by `orgid` and `active`.
- `user_calendar_entries`
  - Core appointment table.
  - Key columns:
    - `uid`: Primary key.
    - `userUid`: The doctor/resource UID.
    - `startdate`, `enddate`: ISO timestamps.
    - `title`, `description`: Event metadata.
    - `active`: Soft delete flag.
    - `orgid`: Organization scoping key.

All reads/writes include `orgid` to ensure tenant isolation.

## 7. Component & File Map

- `app/(main)/sites/calendar/page.tsx` — Server component, loads initial accounts/events.
- `app/(main)/sites/calendar/CalendarClient.tsx` — Client container managing state, refresh, drag/drop, and modal.
- `app/components/ui/big-calendar.tsx` — Wrapper around `react-big-calendar` with drag‑and‑drop and custom rendering.
- `app/components/ui/account-selector/account-selector.tsx` — Doctor chip selector.
- `app/components/ui/appointment/appointment-modal.tsx` — Booking/edit modal with 15‑minute time pickers.
- `app/components/ui/tooltip.tsx` — Tooltip primitive used for event hovers.
- `app/actions/calendar.ts` — Data loading actions (`getCalendarData`, `getDayEvents`).
- `app/actions/appointments.ts` — Create/update/delete actions.
- `app/globals.css` — Calendar theming tokens and overrides.

## 8. Error Handling Strategy

- Server actions validate input (`zod`) and scope by `orgId`. Errors return `{ ok: false, error }` or throw depending on the action.
- The client refresh path is resilient: if day fetch returns zero, the UI uses a client‑side filtered fallback to avoid "blank calendar" regressions.
- Console logs on both sides assist with field debugging during development.

## 9. State Management Philosophy

`CalendarClient` keeps a small, explicit state: `selectedIds`, `currentDate`, `visibleEvents`, and modal control. Logic is colocated with the feature; no global state store is required. All server writes are followed by a scoped fetch to resync.

## 10. Handling Important Edge Cases

- **Overlapping Events**: We rely on `dayLayoutAlgorithm="no-overlap"` and small margins/outline for clear side‑by‑side rendering.
- **Timezone Boundaries**: Day fetch uses an intersection test (start ≤ endOfDay AND end ≥ startOfDay) to include events touching the selected day.
- **Missing Results on Refresh**: Client falls back to filtered initial events; logs counts to the console.
- **Moving Between Doctors**: Dragging across columns updates `userUid` via `onEventDrop` and refreshes the day.

## 11. Planned Items for the Future

- Availability/working‑hours per doctor with dimmed off‑hours and block‑out slots.
- Quick actions in event tooltip (Edit / Move / Cancel)
- Toasts for success/undo on move/resize.
- Better loading states and skeletons for day fetch.
- Server‑side color mapping for `getDayEvents` to always use account colors for consistency.
