# Patients Management Process Documentation

## Overview

Create a new "Patients" screen that serves as a one-stop shop for managing all practice patients with search, filtering, pagination (30 per page), and detailed patient views.

## Architecture

### Database & Queries

The `patient` table already exists in `db/schema.ts` with fields: uid, orgid, id, title, name, surname, dateOfBirth, gender, cellPhone, email, address, active, lastEdit, etc.

Extend `db/queries.ts`:

- `patientQueries.getWithPagination(orgid, page, limit, searchTerm, filters, orderBy)` for server-side pagination
- `patientQueries.getPatientWithFiles(uid, orgid)` to fetch patient with all linked files via `fileinfoPatient`
- `patientQueries.createPatient(data)` for creating patients
- `patientQueries.updatePatient(uid, data)` for updates

### Server Actions

Create `app/actions/patients.ts`:

- `getPatients(page, searchTerm, filters, orderBy)` – server action with auth check, CRITICAL: filter by `session.user.orgId`
- `getPatient(uid)` – fetch single patient with linked files, verify `patient.orgid === session.user.orgId`
- `createPatient(data)` – create new patient with `session.user.orgId`; validate required fields (name, dateOfBirth, id OR isUnder18)
- `updatePatient(uid, data)` – update patient details; verify `patient.orgid === session.user.orgId`

### Type Definitions

Create `app/types/patient.ts`:

```typescript
export interface PatientListItem {
  uid: string;
  id: string;
  name: string;
  surname: string;
  dateOfBirth: string;
  gender: string;
  email: string;
  lastEdit: string;
}

export interface PatientFilters {
  hasId?: boolean;
  hasDob?: boolean;
  dobFrom?: string;
  dobTo?: string;
  gender?: string;
}

export interface PatientWithFiles extends PatientListItem {
  title?: string;
  cellPhone?: string;
  address?: string;
  files: Array<{
    uid: string;
    file_number: string;
    account_number: string;
    lastEdit: string;
  }>;
}
```

### UI Components

Main List Page: `app/(main)/sites/patients/page.tsx`

- Server component that reads searchParams for page, search, filters, orderBy
- Calls `getPatients()` server action
- Renders client component for interactivity

Client Component: `app/(main)/sites/patients/PatientsClient.tsx`

- Search input with 1-second debounce
- Filter bar: has ID, has DOB, DOB range, gender
- Order by: Recently Updated (default), Name A-Z, Date of Birth
- Patient table: ID, Name, Surname, DOB, Gender, Email, Last Updated, Actions
- Pagination controls (Previous/Next, page numbers)
- Updates URL search params on filter/search/page changes
- Create Patient modal with validation (name, dateOfBirth and ID unless `isUnder18`)

Patient Detail Page: `app/(main)/sites/patients/[uid]/page.tsx`

- Card 1: Patient Details – Editable form (title, name, surname, ID, DOB, gender, cell, email, address)
- Card 2: Linked Files – Data table of files with links to `/sites/file-data/[uid]`
- Card 3: Payment History – Under construction placeholder
- Save button in header

### Navigation

Modify `app/components/ui/collapsible-sidebar.tsx`:

- Add `{ name: 'Patients', icon: Users, href: '/sites/patients' }` after "File Data"

### Key Implementation Details

1. Server-side Pagination: Use Drizzle `.limit()` and `.offset()`
2. Fuzzy Search: PostgreSQL `ILIKE`/`LIKE` with wildcards for name, email, id, dob
3. URL State Management: All filters/search/page stored in URL params
4. Debounced Search: 1s debounce before updating URL params
5. Role-based Access: Use `auth()`; currently all roles may view/edit
6. Date Filtering: DOB range via date comparisons
7. Ordering: `ORDER BY lastEdit DESC` (default), `name ASC`, `dateOfBirth ASC`
8. Org Scoping: Every read/write includes `orgid = session.user.orgId`

## File Structure

```
app/
├── (main)/sites/patients/
│   ├── page.tsx (server component)
│   ├── PatientsClient.tsx (client component)
│   └── [uid]/
│       └── page.tsx (patient detail page)
├── actions/
│   └── patients.ts (server actions)
└── types/
    └── patient.ts (TypeScript types)
```

## Dependencies

- Existing: `lucide-react` (Users icon), `drizzle-orm`, UI components (Card, Input, Select, Button, etc.)
- Pattern: Follow existing file-data page patterns for consistency
