import db from "@/app/lib/drizzle";
import { and, eq } from "drizzle-orm";
import { fileInfo, fileinfoPatient, patient, userRoles, users } from "./schema";

// Common query patterns for better type safety and reusability

export const userQueries = {
	// Get user by email
	async getByEmail(email: string) {
		return await db.select().from(users).where(eq(users.email, email)).limit(1);
	},

	// Get user by UID
	async getByUid(uid: string) {
		return await db.select().from(users).where(eq(users.uid, uid)).limit(1);
	},

	// Get user with roles
	async getWithRoles(uid: string) {
		return await db
			.select()
			.from(users)
			.leftJoin(userRoles, eq(users.uid, userRoles.userid))
			.where(eq(users.uid, uid));
	},

	// Get users by organization
	async getByOrganization(orgid: string) {
		return await db
			.select()
			.from(users)
			.where(and(eq(users.orgid, orgid), eq(users.active, true)));
	},
};

export const patientQueries = {
	// Get patient by UID
	async getByUid(uid: string) {
		return await db.select().from(patient).where(eq(patient.uid, uid)).limit(1);
	},

	// Get patients by organization
	async getByOrganization(orgid: string) {
		return await db
			.select()
			.from(patient)
			.where(and(eq(patient.orgid, orgid), eq(patient.active, true)));
	},

	// Get patients with pagination, search, filters, and ordering
	async getWithPagination(
		orgid: string,
		page = 1,
		limit = 30,
		searchTerm?: string,
		filters?: {
			hasId?: boolean;
			hasDob?: boolean;
			dobFrom?: string;
			dobTo?: string;
			gender?: string;
		},
		orderBy: "lastEdit" | "name" | "dateOfBirth" = "lastEdit",
	) {
		const { sql, or, like, gte, lte, isNotNull, desc, asc } = await import(
			"drizzle-orm"
		);

		const offset = (page - 1) * limit;
		const conditions = [eq(patient.orgid, orgid), eq(patient.active, true)];

		// Search across multiple fields with fuzzy matching
		if (searchTerm?.trim()) {
			const trimmedSearch = searchTerm.trim();
			const searchPattern = `%${trimmedSearch}%`;
			conditions.push(
				or(
					like(patient.name, searchPattern),
					like(patient.surname, searchPattern),
					like(patient.email, searchPattern),
					like(patient.id, searchPattern),
					sql`CAST(${patient.dateOfBirth} AS TEXT) LIKE ${searchPattern}`,
				),
			);
		}

		// Apply filters
		if (filters?.hasId) {
			conditions.push(isNotNull(patient.id));
		}
		if (filters?.hasDob) {
			conditions.push(isNotNull(patient.dateOfBirth));
		}
		if (filters?.dobFrom) {
			conditions.push(gte(patient.dateOfBirth, filters.dobFrom));
		}
		if (filters?.dobTo) {
			conditions.push(lte(patient.dateOfBirth, filters.dobTo));
		}
		if (filters?.gender) {
			conditions.push(eq(patient.gender, filters.gender));
		}

		const query = db
			.select({
				uid: patient.uid,
				id: patient.id,
				name: patient.name,
				surname: patient.surname,
				dateOfBirth: patient.dateOfBirth,
				gender: patient.gender,
				email: patient.email,
				lastEdit: patient.lastEdit,
			})
			.from(patient)
			.where(and(...conditions));

		// Apply ordering by computing expressions once
		const orderExprs =
			orderBy === "name"
				? [asc(patient.name), asc(patient.surname)]
				: orderBy === "dateOfBirth"
					? [asc(patient.dateOfBirth)]
					: [desc(patient.lastEdit)];

		const results = await query
			.orderBy(...orderExprs)
			.limit(limit)
			.offset(offset);

		// Get total count for pagination
		const countQuery = await db
			.select({ count: sql<number>`count(*)` })
			.from(patient)
			.where(and(...conditions));

		return {
			patients: results,
			total: Number(countQuery[0]?.count || 0),
			page,
			limit,
			totalPages: Math.ceil(Number(countQuery[0]?.count || 0) / limit),
		};
	},

	// Get patient with all linked files
	async getPatientWithFiles(uid: string, orgid: string) {
		return await db
			.select({
				patient: patient,
				file: {
					uid: fileInfo.uid,
					fileNumber: fileInfo.fileNumber,
					accountNumber: fileInfo.accountNumber,
					lastEdit: fileInfo.lastEdit,
				},
			})
			.from(patient)
			.leftJoin(
				fileinfoPatient,
				and(
					eq(fileinfoPatient.patientid, patient.uid),
					eq(fileinfoPatient.active, true),
				),
			)
			.leftJoin(
				fileInfo,
				and(
					eq(fileInfo.uid, fileinfoPatient.fileid),
					eq(fileInfo.active, true),
				),
			)
			.where(
				and(
					eq(patient.uid, uid),
					eq(patient.orgid, orgid),
					eq(patient.active, true),
				),
			);
	},

	// Update patient
	async updatePatient(uid: string, data: Partial<typeof patient.$inferInsert>) {
		return await db
			.update(patient)
			.set({ ...data, lastEdit: new Date().toISOString() })
			.where(eq(patient.uid, uid))
			.returning();
	},

	// Create patient
	async createPatient(data: typeof patient.$inferInsert) {
		return await db
			.insert(patient)
			.values({
				...data,
				uid: crypto.randomUUID(),
				active: true,
				dateCreated: new Date().toISOString(),
				lastEdit: new Date().toISOString(),
				locked: false,
			})
			.returning();
	},
};

export const fileQueries = {
	// Get file with patient information
	async getFileWithPatient(fileUid: string) {
		return await db
			.select()
			.from(fileInfo)
			.leftJoin(fileinfoPatient, eq(fileInfo.uid, fileinfoPatient.fileid))
			.leftJoin(patient, eq(fileinfoPatient.patientid, patient.uid))
			.where(eq(fileInfo.uid, fileUid))
			.limit(1);
	},

	// Get files by organization
	async getByOrganization(orgid: string) {
		return await db
			.select()
			.from(fileInfo)
			.where(and(eq(fileInfo.orgid, orgid), eq(fileInfo.active, true)));
	},
};

// Helper function to format timestamps
export const formatTimestamp = () => new Date().toISOString();

// Helper for generating UUIDs (you might want to use the crypto.randomUUID() or uuid package)
export const generateUUID = () => crypto.randomUUID();
