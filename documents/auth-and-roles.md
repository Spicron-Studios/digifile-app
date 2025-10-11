## Authentication and Roles — Developer Guide

### Overview

- Uses NextAuth with JWT sessions and a Drizzle adapter.
- Each user has exactly one role via a direct foreign key on `users.role_id → roles.uid`.
- Session contains `user.id`, `user.orgId`, and `user.role` (single role object).
- All org-scoped reads/writes filter by `session.user.orgId`.
- Elevated access means any of: SuperUser, Admin, Organizer.

### Role Catalog

- SuperUser: Full access within an organization; includes org settings and user management.
- Admin: Elevated access, can manage organization settings and users.
- Organizer: Elevated access similar to Admin (manage users and org-level settings where applicable).
- Member: Default role; restricted to their own data, no organization settings.
  Notes:
- Role name checks are case-insensitive.
- Elevated access = SuperUser OR Admin OR Organizer.

### Database Schema

- `roles` (catalog of roles)
  - At minimum: `uid` (PK), `name` (unique, e.g., SuperUser/Admin/Organizer/Member), `active` (optional).
- `users`
  - `uid` (PK), `org_id` (FK to organization), `role_id` (FK to `roles.uid`).
  - Enforces one-to-one user→role at the DB level.

Migration (applied):

- File: `db/drizzle/0001_add_user_role_direct_assignment.sql`
- Populates `users.role_id` from the most recent active entry in legacy `user_roles`:

```sql
WITH ranked_user_roles AS (
  SELECT userid, roleid,
         ROW_NUMBER() OVER (PARTITION BY userid ORDER BY date_created DESC) as rn
  FROM user_roles ur
  WHERE ur.active = true
)
UPDATE users SET role_id = ranked_user_roles.roleid
FROM ranked_user_roles
WHERE users.uid = ranked_user_roles.userid AND ranked_user_roles.rn = 1;
```

### Authentication Flow

- Registration
  - On organization registration, the first user is created and directly assigned the SuperUser role.
  - If `SuperUser` role does not exist, it is created as active.
- Session enrichment (JWT callback)
  - Load the user’s single role by `users.role_id`.
  - Session shape: `session.user = { id, orgId, role: { uid, name } }`.

### Authorization and Access Checks

- UI
  - Organization settings tabs are visible only if `hasElevatedAccess(session.user.role)`.
- API
  - Use a shared auth wrapper that:
    - Validates session, ensures `session.user.orgId` is present.
    - Performs explicit role checks for elevated routes.

Recommended helpers in `app/lib/api-auth.ts`:

```ts
export type RoleName = 'SuperUser' | 'Admin' | 'Organizer' | 'Member';
export interface Role {
  uid: string;
  name: string;
}
export function isSuperUser(role: Role | null | undefined): boolean {
  return (role?.name ?? '').toLowerCase() === 'superuser';
}
export function isAdmin(role: Role | null | undefined): boolean {
  return (role?.name ?? '').toLowerCase() === 'admin';
}
export function isOrganizer(role: Role | null | undefined): boolean {
  return (role?.name ?? '').toLowerCase() === 'organizer';
}
export function hasElevatedAccess(role: Role | null | undefined): boolean {
  const n = (role?.name ?? '').toLowerCase();
  return n === 'superuser' || n === 'admin' || n === 'organizer';
}
```

### API Endpoints

- `GET /api/settings/users`
  - Returns users including their single role.
- `GET /api/settings/users/[uid]/roles`
  - Returns the user’s single role object `{ uid, name }`.
- `PUT /api/settings/users/[uid]/roles`
  - Body: `{ "roleId": "<role-uid>" }`.
  - Requires elevated access; updates `users.role_id`.

### Frontend: Role Management UI

- `app/(main)/sites/settings/UserSettings.tsx`
  - Displays current role and a dropdown for selecting a single role.
  - Only elevated users can change roles.

### Files and Responsibilities

- `db/schema.ts`: Defines `users.role_id` FK → `roles.uid`.
- `db/drizzle/0001_add_user_role_direct_assignment.sql`: Migration that backfills `users.role_id`.
- `app/lib/auth.ts`: Session and JWT callbacks; load single role into `session.user.role`.
- `app/lib/api-auth.ts`: Role helpers (see above).
- `app/actions/register.ts`: Assign SuperUser to the first org user on registration.
- `app/actions/users.ts`: Single-role assignment utilities.
- `app/api/settings/users/route.ts`: Users listing with role data.
- `app/api/settings/users/[uid]/roles/route.ts`: Get/put single role for a user.

### Testing Checklist

- Database/Migration
  - Apply migration and verify `users.role_id` populated.
- Registration
  - New org’s first user becomes SuperUser.
- Authentication
  - Session contains `{ id, orgId, role }` (single role).
- Role Management
  - Elevated user can update another user’s role via dropdown and API persists change.
- Permissions
  - SuperUser/Admin/Organizer access org settings; Member cannot.
- API
  - `GET /api/settings/users` returns users with single role.
  - `GET/PUT /api/settings/users/[uid]/roles` returns/updates a single role.

### Future Enhancements

- Seed well-known roles on bootstrap (SuperUser, Admin, Organizer, Member).
- Centralize permission policies per feature (policy objects).
- Upgrade password hashing and align credentials provider to bcrypt verification.
- Consider role templates/permissions granularity and audit trails as the system grows.
