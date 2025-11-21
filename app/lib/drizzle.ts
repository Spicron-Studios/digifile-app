import { schema } from "@/db/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Create the postgres connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
	throw new Error("DATABASE_URL environment variable is not set");
}

// Create the postgres client
const client = postgres(connectionString, {
	max: 1,
	// Disable prepared statements for compatibility
	prepare: false,
});

// Create the Drizzle database instance
const db = drizzle(client, { schema });

export default db;

// Export types for use in the application
export type Database = typeof db;
export { schema };

// Export table references for easier imports
export {
	organizationInfo,
	users,
	roles,
	userRoles,
	practiceTypes,
	patient,
	medicalScheme,
	patientMedicalAid,
	patientmedicalaidFilePatient,
	personResponsible,
	fileInfo,
	fileinfoPatient,
	injuryOnDuty,
	tabNotes,
	tabFiles,
	userCalendarEntries,
	logoTable,
	notifications,
	organizationPaymentDetails,
	signature,
} from "@/db/schema";
