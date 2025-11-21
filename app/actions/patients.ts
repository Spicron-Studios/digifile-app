"use server";

import { auth } from "@/app/lib/auth";
import { logger } from "@/app/lib/foundation";
import {
	generateExpiringLink,
	generateTabletLink,
} from "@/app/lib/intake-tokens";
import type {
	CreatePatientData,
	PaginatedPatients,
	PatientFilters,
	PatientListItem,
	PatientWithFiles,
} from "@/app/types/patient";
import { patientQueries } from "@/db/queries";

/**
 * Calculates age from a date of birth
 * @param dateOfBirth - Date string (YYYY-MM-DD) or Date object
 * @returns Age in years, or null if dateOfBirth is invalid
 */
function calculateAge(
	dateOfBirth: string | Date | null | undefined,
): number | null {
	if (!dateOfBirth) {
		return null;
	}

	let dobDate: Date;
	if (typeof dateOfBirth === "string") {
		// Handle YYYY-MM-DD format
		const dateParts = dateOfBirth.split(/[-\/]/);
		if (dateParts.length !== 3) {
			return null;
		}
		const year = Number.parseInt(dateParts[0] || "", 10);
		const month = Number.parseInt(dateParts[1] || "", 10) - 1; // Month is 0-indexed
		const day = Number.parseInt(dateParts[2] || "", 10);
		if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
			return null;
		}
		dobDate = new Date(year, month, day);
	} else {
		dobDate = new Date(dateOfBirth);
	}

	if (Number.isNaN(dobDate.getTime())) {
		return null;
	}

	const today = new Date();
	let age = today.getFullYear() - dobDate.getFullYear();
	const monthDiff = today.getMonth() - dobDate.getMonth();

	if (
		monthDiff < 0 ||
		(monthDiff === 0 && today.getDate() < dobDate.getDate())
	) {
		age--;
	}

	return age;
}

export async function getPatients(
	page = 1,
	searchTerm?: string,
	filters?: PatientFilters,
	orderBy: "lastEdit" | "name" | "dateOfBirth" = "lastEdit",
): Promise<PaginatedPatients> {
	const session = await auth();
	if (!session?.user?.orgId) {
		await logger.warning("actions/patients.ts", "Unauthorized: missing orgId");
		return {
			patients: [],
			total: 0,
			page: 1,
			limit: 30,
			totalPages: 0,
		};
	}

	await logger.info(
		"actions/patients.ts",
		`Fetching patients for orgId=${session.user.orgId}, page=${page}, search=${searchTerm}`,
	);

	try {
		// CRITICAL: Always filter by organization ID
		const result = await patientQueries.getWithPagination(
			session.user.orgId,
			page,
			30,
			searchTerm,
			filters,
			orderBy,
		);

		await logger.info(
			"actions/patients.ts",
			`Returning ${result.patients.length} patients (total: ${result.total})`,
		);

		return {
			patients: result.patients as PatientListItem[],
			total: result.total,
			page: result.page,
			limit: result.limit,
			totalPages: result.totalPages,
		};
	} catch (error) {
		await logger.error(
			"actions/patients.ts",
			`Error fetching patients: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
		return {
			patients: [],
			total: 0,
			page: 1,
			limit: 30,
			totalPages: 0,
		};
	}
}

export async function getPatient(
	uid: string,
): Promise<PatientWithFiles | null> {
	const session = await auth();
	if (!session?.user?.orgId) {
		await logger.warning("actions/patients.ts", "Unauthorized: missing orgId");
		return null;
	}

	await logger.info(
		"actions/patients.ts",
		`Fetching patient uid=${uid} for orgId=${session.user.orgId}`,
	);

	try {
		// CRITICAL: Verify patient belongs to user's organization
		const results = await patientQueries.getPatientWithFiles(
			uid,
			session.user.orgId,
		);

		if (!results || results.length === 0) {
			await logger.warning(
				"actions/patients.ts",
				`Patient ${uid} not found or does not belong to organization ${session.user.orgId}`,
			);
			return null;
		}

		// Extract patient data and files
		const firstResult = results[0];
		if (!firstResult) {
			await logger.warning(
				"actions/patients.ts",
				`No patient data found for uid=${uid}`,
			);
			return null;
		}

		const patientData = firstResult.patient;
		const files = results
			.filter((r) => r.file && r.file.uid !== null)
			.map((r) => ({
				uid: r.file?.uid ?? "",
				file_number: r.file?.fileNumber ?? "",
				account_number: r.file?.accountNumber ?? "",
				lastEdit: r.file?.lastEdit ?? "",
			}));

		const patient: PatientWithFiles = {
			uid: patientData.uid,
			id: patientData.id,
			title: patientData.title,
			name: patientData.name,
			initials: patientData.initials,
			surname: patientData.surname,
			dateOfBirth: patientData.dateOfBirth?.toString() || null,
			gender: patientData.gender,
			cellPhone: patientData.cellPhone,
			email: patientData.email,
			address: patientData.address,
			additionalName: patientData.additionalName,
			additionalCell: patientData.additionalCell,
			lastEdit: patientData.lastEdit,
			files,
		};

		await logger.info(
			"actions/patients.ts",
			`Returning patient ${uid} with ${files.length} linked files`,
		);

		return patient;
	} catch (error) {
		await logger.error(
			"actions/patients.ts",
			`Error fetching patient: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
		return null;
	}
}

export async function createPatient(
	data: CreatePatientData,
): Promise<{ success: boolean; patient?: PatientWithFiles; error?: string }> {
	const session = await auth();
	if (!session?.user?.orgId) {
		await logger.warning("actions/patients.ts", "Unauthorized: missing orgId");
		return { success: false, error: "Unauthorized" };
	}

	// Validate required fields
	if (!data.name || !data.dateOfBirth) {
		return {
			success: false,
			error: "Name and date of birth are required",
		};
	}

	// If not under 18, ID is required
	if (!data.isUnder18 && !data.id) {
		return {
			success: false,
			error: "ID is required for patients 18 years or older",
		};
	}

	await logger.info(
		"actions/patients.ts",
		`Creating patient for orgId=${session.user.orgId}`,
	);

	try {
		const newPatient = await patientQueries.createPatient({
			uid: crypto.randomUUID(),
			orgid: session.user.orgId,
			name: data.name,
			surname: data.surname || null,
			dateOfBirth: data.dateOfBirth,
			id: data.isUnder18 ? null : data.id || null,
			title: data.title || null,
			gender: data.gender || null,
			cellPhone: data.cellPhone || null,
			email: data.email || null,
			address: data.address || null,
			active: true,
			dateCreated: new Date().toISOString(),
			lastEdit: new Date().toISOString(),
			locked: false,
		});

		if (!newPatient || newPatient.length === 0) {
			return { success: false, error: "Failed to create patient" };
		}

		const created = newPatient[0];
		if (!created) {
			return { success: false, error: "Failed to create patient" };
		}

		await logger.info(
			"actions/patients.ts",
			`Created patient uid=${created.uid}`,
		);

		const patientWithFiles: PatientWithFiles = {
			uid: created.uid,
			id: created.id,
			title: created.title,
			name: created.name,
			initials: created.initials,
			surname: created.surname,
			dateOfBirth: created.dateOfBirth?.toString() || null,
			gender: created.gender,
			cellPhone: created.cellPhone,
			email: created.email,
			address: created.address,
			additionalName: created.additionalName,
			additionalCell: created.additionalCell,
			lastEdit: created.lastEdit,
			files: [],
		};

		const result: {
			success: boolean;
			patient?: PatientWithFiles;
			error?: string;
		} = {
			success: true,
			patient: patientWithFiles,
		};

		return result;
	} catch (error) {
		await logger.error(
			"actions/patients.ts",
			`Error creating patient: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to create patient",
		};
	}
}

export async function updatePatient(
	uid: string,
	data: Partial<CreatePatientData>,
): Promise<{ success: boolean; patient?: PatientWithFiles; error?: string }> {
	const session = await auth();
	if (!session?.user?.orgId) {
		await logger.warning("actions/patients.ts", "Unauthorized: missing orgId");
		return { success: false, error: "Unauthorized" };
	}

	await logger.info(
		"actions/patients.ts",
		`Updating patient uid=${uid} for orgId=${session.user.orgId}`,
	);

	try {
		// CRITICAL: First verify patient belongs to user's organization
		const existing = await patientQueries.getPatientWithFiles(
			uid,
			session.user.orgId,
		);

		if (!existing || existing.length === 0) {
			await logger.warning(
				"actions/patients.ts",
				`Patient ${uid} not found or does not belong to organization ${session.user.orgId}`,
			);
			return {
				success: false,
				error: "Patient not found or access denied",
			};
		}

		const existingPatient = existing[0]?.patient;
		if (!existingPatient) {
			await logger.warning(
				"actions/patients.ts",
				`No patient data found for uid=${uid}`,
			);
			return {
				success: false,
				error: "Patient not found",
			};
		}

		// Determine effective dateOfBirth (use update data if provided, else existing)
		const effectiveDateOfBirth =
			data.dateOfBirth ?? existingPatient.dateOfBirth;

		// Calculate age from effective dateOfBirth
		const age = calculateAge(effectiveDateOfBirth);

		if (age === null) {
			await logger.warning(
				"actions/patients.ts",
				`Invalid dateOfBirth for patient uid=${uid}`,
			);
			return {
				success: false,
				error: "Invalid date of birth",
			};
		}

		// Determine effective ID (use update data if provided, else existing)
		// If data.id is explicitly undefined, we keep existing; if it's a string (even empty), we use it
		const effectiveId = data.id !== undefined ? data.id : existingPatient.id;

		// Validate age-based ID rules
		if (age >= 18) {
			// Patients 18+ must have an ID
			if (!effectiveId || effectiveId.trim() === "") {
				await logger.warning(
					"actions/patients.ts",
					`Patient uid=${uid} is 18+ but missing ID`,
				);
				return {
					success: false,
					error: "ID is required for patients 18 years or older",
				};
			}
		} else {
			// Patients under 18 must NOT have an ID
			// If an ID is present (either in update or existing), return failure
			if (effectiveId && effectiveId.trim() !== "") {
				await logger.warning(
					"actions/patients.ts",
					`Patient uid=${uid} is under 18 but has ID`,
				);
				return {
					success: false,
					error: "ID cannot be set for patients under 18 years old",
				};
			}
		}

		// Prepare update data - ensure ID is null for under-18 patients
		// Only include fields that are being updated
		const updateData: Partial<typeof existingPatient> = {};

		if (data.name !== undefined) {
			updateData.name = data.name;
		}
		if (data.surname !== undefined) {
			updateData.surname = data.surname;
		}
		if (data.dateOfBirth !== undefined) {
			updateData.dateOfBirth = data.dateOfBirth;
		}
		// Always update ID based on age validation
		updateData.id = age >= 18 ? effectiveId || null : null;

		if (data.title !== undefined) {
			updateData.title = data.title;
		}
		if (data.gender !== undefined) {
			updateData.gender = data.gender;
		}
		if (data.cellPhone !== undefined) {
			updateData.cellPhone = data.cellPhone;
		}
		if (data.email !== undefined) {
			updateData.email = data.email;
		}
		if (data.address !== undefined) {
			updateData.address = data.address;
		}

		// Update patient
		const updated = await patientQueries.updatePatient(uid, updateData);

		if (!updated || updated.length === 0) {
			return { success: false, error: "Failed to update patient" };
		}

		// Get updated patient with files
		const patientWithFiles = await getPatient(uid);

		await logger.info("actions/patients.ts", `Updated patient uid=${uid}`);

		if (patientWithFiles) {
			return {
				success: true,
				patient: patientWithFiles,
			};
		}
		return {
			success: true,
		};
	} catch (error) {
		await logger.error(
			"actions/patients.ts",
			`Error updating patient: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "Failed to update patient",
		};
	}
}

export async function generatePublicIntakeLink(
	baseUrl?: string,
): Promise<{ url: string } | { error: string }> {
	const session = await auth();
	if (!session?.user?.orgId) {
		await logger.warning(
			"actions/patients.ts",
			"Unauthorized: missing orgId for link generation",
		);
		return { error: "Unauthorized" };
	}
	const secret = process.env.INTAKE_FORM_SECRET;
	if (!secret) {
		await logger.error("actions/patients.ts", "Missing INTAKE_FORM_SECRET");
		return { error: "Server misconfiguration" };
	}
	const baseFromParam = (baseUrl || "").replace(/\/$/, "");
	const baseEnv = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
	const base = baseFromParam || baseEnv || "";
	const url = generateExpiringLink(session.user.orgId, secret, base);
	await logger.info(
		"actions/patients.ts",
		`Generated expiring intake link for org=${session.user.orgId}`,
	);
	return { url };
}

export async function generateTabletIntakeLink(
	baseUrl?: string,
): Promise<{ url: string } | { error: string }> {
	const session = await auth();
	if (!session?.user?.orgId) {
		await logger.warning(
			"actions/patients.ts",
			"Unauthorized: missing orgId for tablet link generation",
		);
		return { error: "Unauthorized" };
	}
	const secret = process.env.INTAKE_FORM_SECRET;
	if (!secret) {
		await logger.error("actions/patients.ts", "Missing INTAKE_FORM_SECRET");
		return { error: "Server misconfiguration" };
	}
	const baseFromParam = (baseUrl || "").replace(/\/$/, "");
	const baseEnv = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
	const base = baseFromParam || baseEnv || "";
	const url = generateTabletLink(session.user.orgId, secret, base);
	await logger.info(
		"actions/patients.ts",
		`Generated tablet intake link for org=${session.user.orgId}`,
	);
	return { url };
}
