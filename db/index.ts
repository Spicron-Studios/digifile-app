// Main database instance and configuration
export { default as db } from "@/app/lib/drizzle";
export type { Database } from "@/app/lib/drizzle";

// Schema and all tables
export * from "./schema";

// Query helpers
export * from "./queries";

// Commonly used table exports for convenience
export {
	organizationInfo,
	users,
	roles,
	userRoles,
	patient,
	fileInfo,
	fileinfoPatient,
	tabNotes,
	tabFiles,
} from "./schema";
