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

### Core Migration Commands

- `npm run db:generate` - Generate migration files from schema changes in `db/schema.ts`.
- `npm run db:migrate` - Apply pending migrations to the database.
- `npm run db:check` - Check migration status.

### Development & Utility Commands

- `npm run db:studio` - Open the Drizzle Studio web interface for easy database browsing.
- `npm run db:push` - Push schema changes directly to the database without creating a migration file. **Use with caution, primarily for rapid prototyping.**
- `npm run db:introspect` - **(Legacy)** Pull schema from the existing database. This is no longer part of the primary workflow.
- `npm run db:drop` - Remove the last migration file.

## Configuration

Database configuration is managed through:

- `drizzle.config.ts` - Drizzle Kit configuration
- `app/lib/drizzle.ts` - Database client setup
- Environment variable: `DATABASE_URL` - PostgreSQL connection string

## Database Source of Truth

The **`db/schema.ts` file is the single source of truth** for the database schema. All changes to the database structure (tables, columns, relations) should be made directly in this file.

Migrations are then generated from this schema file and applied to the Supabase database. This ensures a consistent, version-controlled history of your database structure.

## Migration Workflow

The workflow is the same for both development and production environments.

1.  **Edit `db/schema.ts`**: Make your desired changes directly to the table definitions or relations in the schema file.
2.  **Generate Migration**: Run the following command to create a new SQL migration file based on your changes:
    ```bash
    npm run db:generate
    ```
3.  **Review and Apply Migration**: Check the generated SQL file in `db/drizzle/` to ensure it's correct. Then, apply the migration to your database:
    ```bash
    npm run db:migrate
    ```

## Tips

- Always use the query helpers in `queries.ts` for common database operations.
- **Always make schema changes in `db/schema.ts`**. This is your source of truth.
- Use Drizzle Studio (`npm run db:studio`) for database exploration and debugging.
- Keep the database URL in environment variables for security.
