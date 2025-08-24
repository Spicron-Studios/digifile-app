# Database Configuration

This folder contains all Drizzle ORM related files and configuration for the digifile-app project.

## Structure

```
db/
├── drizzle/           # Migration files and metadata
│   ├── meta/         # Drizzle migration metadata
│   └── *.sql         # Generated migration files
├── schema.ts         # Single consolidated schema file
├── queries.ts        # Helper functions for common queries
├── index.ts          # Main exports for the db module
└── README.md         # This documentation
```

## Files

### `schema.ts`

- **Single source of truth** for all table definitions and relations
- Generated from existing Supabase database via introspection
- Contains both table schemas and Drizzle relations
- Organized in logical groups (Organization, Users, Patients, Files, etc.)

### `queries.ts`

- Type-safe query helpers for common database operations
- Reusable query patterns to avoid code duplication
- Helper functions for timestamps and UUIDs

### `index.ts`

- Main export file for the db module
- Exports database instance, schema, queries, and commonly used tables
- Convenient single import point for database operations

## Usage

### Importing the Database

```typescript
// Import everything
import { db, users, userQueries } from '@/db';

// Or import specific items
import db from '@/app/lib/drizzle';
import { users, organizationInfo } from '@/db/schema';
```

### Using Query Helpers

```typescript
import { userQueries, patientQueries } from '@/db';

// Get user by email
const user = await userQueries.getByEmail('user@example.com');

// Get user with roles
const userWithRoles = await userQueries.getWithRoles('user-uid');

// Get patients by organization
const patients = await patientQueries.getByOrganization('org-uid');
```

### Direct Database Queries

```typescript
import { db, users, eq } from '@/db';

// Direct query
const user = await db
  .select()
  .from(users)
  .where(eq(users.email, 'user@example.com'));
```

## Available Commands

All commands can be run from the project root:

### Development Commands

- `npm run db:push` - Push schema changes directly to database (development)
- `npm run db:studio` - Open Drizzle Studio web interface
- `npm run db:introspect` - Pull schema from existing database

### Production Commands

- `npm run db:generate` - Generate migration files from schema changes
- `npm run db:migrate` - Apply pending migrations to database
- `npm run db:check` - Check migration status

### Utility Commands

- `npm run db:drop` - Remove the last migration file

## Configuration

Database configuration is managed through:

- `drizzle.config.ts` - Drizzle Kit configuration
- `app/lib/drizzle.ts` - Database client setup
- Environment variable: `DATABASE_URL` - PostgreSQL connection string

## Database Source of Truth

The **Supabase database is the source of truth**. The schema file is generated from the existing database using:

```bash
npm run db:introspect
```

This ensures the schema always matches the actual database structure.

## Migration Workflow

### Development

1. Make changes in Supabase console or admin tools
2. Run `npm run db:introspect` to update schema
3. Test changes with `npm run db:studio`

### Production

1. Generate migrations: `npm run db:generate`
2. Review generated SQL files in `db/drizzle/`
3. Apply migrations: `npm run db:migrate`

## Tips

- Always use the query helpers in `queries.ts` for common operations
- The schema file is auto-generated - don't edit manually
- Use Drizzle Studio for database exploration and debugging
- Keep the database URL in environment variables for security
