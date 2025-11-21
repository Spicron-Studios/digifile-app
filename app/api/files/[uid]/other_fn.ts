import db, {
	medicalScheme,
	tabNotes,
	tabFiles,
	fileinfoPatient,
	patient,
} from "@/app/lib/drizzle";
import { Logger } from "@/app/lib/logger/logger.service";
import { getBucket } from "@/app/lib/storage";
import type {
	DbWriteResponse,
	NoteData,
	SmartNoteData,
	TabNoteRecord,
} from "@/app/types/db-types";
import { createClient } from "@supabase/supabase-js";
import { and, asc, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
	throw new Error(
		"Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
	);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to fetch medical schemes
export async function fetchMedicalSchemes(
	orgId: string,
): Promise<Array<{ uid: string; scheme_name: string | null }>> {
	const logger = Logger.getInstance();
	await logger.init();

	try {
		// Fetch active medical schemes for the organization
		const schemes = await db
			.select({
				uid: medicalScheme.uid,
				scheme_name: medicalScheme.schemeName,
			})
			.from(medicalScheme)
			.where(
				and(eq(medicalScheme.active, true), eq(medicalScheme.orgid, orgId)),
			)
			.orderBy(asc(medicalScheme.schemeName));

		return schemes;
	} catch (error) {
		await logger.error(
			"api/files/[uid]/other_fn.ts",
			`Error fetching medical schemes: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
		return [];
	}
}

// Helper function to save a new note and its files
export async function saveNoteWithFiles(
	noteData: NoteData,
): Promise<DbWriteResponse<TabNoteRecord>> {
	const logger = Logger.getInstance();
	await logger.init();

	try {
		await logger.info("api/files/[uid]/other_fn.ts", "Saving new note");

		// 1. Create the note record in tab_notes
		const noteUid = uuidv4();
		await db.insert(tabNotes).values({
			uid: noteUid,
			orgid: noteData.orgId,
			fileinfoPatientId: noteData.fileInfoPatientId,
			personid: noteData.patientId,
			timeStamp: new Date(noteData.timeStamp).toISOString(),
			notes: noteData.notes,
			tabType: noteData.tabType, // 'file' or 'clinical'
			active: true,
			dateCreated: new Date().toISOString(),
			lastEdit: new Date().toISOString(),
			locked: false,
		});

		await logger.info(
			"api/files/[uid]/other_fn.ts",
			`Note created with ID: ${noteUid}`,
		);

		// 2. Upload files to Supabase and create records in tab_files
		const fileRecords: Array<{
			uid: string;
			file_name: string | null;
			file_type: string | null;
			file_location: string | null;
		}> = [];

		if (noteData.files && noteData.files.length > 0) {
			await logger.debug(
				"api/files/[uid]/other_fn.ts",
				`Processing ${noteData.files.length} files`,
			);

			for (const fileData of noteData.files) {
				// Generate a unique filename while preserving the extension
				const fileExtension = fileData.name.split(".").pop();
				const uniqueFileName = `${uuidv4()}.${fileExtension}`;
				const storageLocation = `${noteData.orgId}/note-docs/${uniqueFileName}`;

				// Convert base64 to file
				const base64Data = fileData.content.split(";base64,").pop();
				if (!base64Data) {
					await logger.error(
						"api/files/[uid]/other_fn.ts",
						`Invalid base64 content for file ${fileData.name}`,
					);
					continue;
				}
				const fileBuffer = Buffer.from(base64Data, "base64");

				// Upload to Supabase
				const { error } = await supabase.storage
					.from(getBucket("ATTACHMENTS"))
					.upload(storageLocation, fileBuffer, {
						contentType: fileData.type,
					});

				if (error) {
					await logger.error(
						"api/files/[uid]/other_fn.ts",
						`Error uploading file: ${error.message}`,
					);
					continue;
				}

				// Create record in tab_files
				const fileUid = uuidv4();
				await db.insert(tabFiles).values({
					uid: fileUid,
					orgid: noteData.orgId,
					tabNotesId: noteUid,
					fileName: fileData.name,
					fileType: fileData.type,
					fileLocation: storageLocation,
					active: true,
					dateCreated: new Date().toISOString(),
					lastEdit: new Date().toISOString(),
					locked: false,
				});

				fileRecords.push({
					uid: fileUid,
					file_name: fileData.name,
					file_type: fileData.type,
					file_location: storageLocation,
				});

				await logger.info(
					"api/files/[uid]/other_fn.ts",
					`File uploaded and record created for ${fileData.name}`,
				);
			}
		}

		// 3. Return the complete note data with file records
		const completeNote: TabNoteRecord = {
			uid: noteUid,
			time_stamp: new Date(noteData.timeStamp).toISOString(),
			notes: noteData.notes,
			tab_type: noteData.tabType,
			files: fileRecords,
		};

		await logger.info(
			"api/files/[uid]/other_fn.ts",
			"Note saved successfully with all files",
		);
		return { data: completeNote, status: 200 };
	} catch (error) {
		await logger.error(
			"api/files/[uid]/other_fn.ts",
			`Error saving note: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
		return { error: "Failed to save note", status: 500 };
	}
}

// Smart note save that ensures a file-patient link exists (creating minimal patient+link if needed)
export async function saveNoteSmart(
	data: SmartNoteData,
): Promise<DbWriteResponse<TabNoteRecord>> {
	const logger = Logger.getInstance();
	await logger.init();

	try {
		await logger.info("api/files/[uid]/other_fn.ts", "Smart note save invoked");

		if (!data.orgId || !data.fileUid) {
			await logger.warning(
				"api/files/[uid]/other_fn.ts",
				"Missing orgId or fileUid in smart note request",
			);
			return { error: "Missing orgId or fileUid", status: 400 };
		}

		// 1) Try find existing active file-patient link for this file
		const linkRows = await db
			.select({ link: fileinfoPatient, patient })
			.from(fileinfoPatient)
			.leftJoin(patient, eq(fileinfoPatient.patientid, patient.uid))
			.where(
				and(
					eq(fileinfoPatient.fileid, data.fileUid),
					eq(fileinfoPatient.orgid, data.orgId),
					eq(fileinfoPatient.active, true),
				),
			)
			.limit(1);

		let fileInfoPatientId: string | null = null;
		let patientUid: string | null = null;

		if (linkRows.length > 0 && linkRows[0]) {
			fileInfoPatientId = linkRows[0].link.uid;
			patientUid = linkRows[0].patient?.uid ?? null;
		}

		// 2) If no link, we need a patient (via id number) and create the link
		if (!fileInfoPatientId) {
			if (!data.patientIdNumber) {
				await logger.warning(
					"api/files/[uid]/other_fn.ts",
					"No file link and no patientIdNumber supplied",
				);
				return { error: "Patient ID number is required", status: 400 };
			}

			// Find existing patient by national ID number
			const existingPatients = await db
				.select()
				.from(patient)
				.where(
					and(
						eq(patient.id, data.patientIdNumber),
						eq(patient.orgid, data.orgId),
						eq(patient.active, true),
					),
				)
				.limit(1);

			if (existingPatients.length > 0 && existingPatients[0]) {
				patientUid = existingPatients[0].uid;
			} else {
				// Create a minimal patient
				const newPatientUid = uuidv4();
				await db.insert(patient).values({
					uid: newPatientUid,
					id: data.patientIdNumber,
					title: "",
					name: "",
					initials: "",
					surname: "",
					dateOfBirth: null,
					gender: "",
					cellPhone: "",
					additionalName: "",
					additionalCell: "",
					email: "",
					address: "",
					orgid: data.orgId,
					active: true,
					dateCreated: new Date().toISOString(),
					lastEdit: new Date().toISOString(),
				});
				patientUid = newPatientUid;
				await logger.info(
					"api/files/[uid]/other_fn.ts",
					`Created minimal patient with UID: ${newPatientUid}`,
				);
			}

			// Create the file-patient link
			if (!patientUid) {
				throw new Error("Failed to create or find patient UID");
			}
			const newLinkUid = uuidv4();
			await db.insert(fileinfoPatient).values({
				uid: newLinkUid,
				fileid: data.fileUid,
				patientid: patientUid,
				orgid: data.orgId,
				active: true,
				dateCreated: new Date().toISOString(),
				lastEdit: new Date().toISOString(),
			});
			fileInfoPatientId = newLinkUid;

			await logger.info(
				"api/files/[uid]/other_fn.ts",
				`Created file-patient link with UID: ${newLinkUid}`,
			);
		}

		// 3) We now have the required IDs to save the note
		const notePayload: NoteData = {
			orgId: data.orgId,
			fileInfoPatientId: fileInfoPatientId as string,
			patientId: (patientUid as string) ?? "",
			timeStamp: data.timeStamp,
			notes: data.notes,
			tabType: data.tabType,
			files: data.files ?? [],
		};

		const result = await saveNoteWithFiles(notePayload);
		if (result.error) return result;
		return result;
	} catch (error) {
		await logger.error(
			"api/files/[uid]/other_fn.ts",
			`Error in smart note save: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
		return { error: "Failed to save note", status: 500 };
	}
}

// Update an existing note's description and optionally append new files
export async function updateNoteWithFiles(params: {
	orgId: string;
	noteUid: string;
	notes: string;
	files?: Array<{ name: string; type: string; content: string }> | undefined;
}): Promise<DbWriteResponse<TabNoteRecord>> {
	const logger = Logger.getInstance();
	await logger.init();

	try {
		await logger.info("api/files/[uid]/other_fn.ts", "Updating existing note");

		// Update the note text
		await db
			.update(tabNotes)
			.set({ notes: params.notes, lastEdit: new Date().toISOString() })
			.where(
				and(eq(tabNotes.uid, params.noteUid), eq(tabNotes.orgid, params.orgId)),
			);

		// Fetch the current note (to get timeStamp and tabType)
		const notesRows = await db
			.select()
			.from(tabNotes)
			.where(
				and(eq(tabNotes.uid, params.noteUid), eq(tabNotes.orgid, params.orgId)),
			)
			.limit(1);

		const currentNote = notesRows[0];
		if (!currentNote) {
			return { error: "Note not found", status: 404 };
		}

		const fileRecords: Array<{
			uid: string;
			file_name: string | null;
			file_type: string | null;
			file_location: string | null;
		}> = [];

		// Append any new files
		if (params.files && params.files.length > 0) {
			for (const fileData of params.files) {
				const fileExtension = fileData.name.split(".").pop();
				const uniqueFileName = `${uuidv4()}.${fileExtension}`;
				const storageLocation = `${params.orgId}/note-docs/${uniqueFileName}`;

				const base64Data = fileData.content.split(";base64,").pop();
				if (!base64Data) {
					await logger.error(
						"api/files/[uid]/other_fn.ts",
						`Invalid base64 content for file ${fileData.name}`,
					);
					continue;
				}
				const fileBuffer = Buffer.from(base64Data, "base64");

				const { error } = await supabase.storage
					.from(getBucket("ATTACHMENTS"))
					.upload(storageLocation, fileBuffer, { contentType: fileData.type });
				if (error) {
					await logger.error(
						"api/files/[uid]/other_fn.ts",
						`Error uploading file: ${error.message}`,
					);
					continue;
				}

				const fileUid = uuidv4();
				await db.insert(tabFiles).values({
					uid: fileUid,
					orgid: params.orgId,
					tabNotesId: params.noteUid,
					fileName: fileData.name,
					fileType: fileData.type,
					fileLocation: storageLocation,
					active: true,
					dateCreated: new Date().toISOString(),
					lastEdit: new Date().toISOString(),
					locked: false,
				});

				fileRecords.push({
					uid: fileUid,
					file_name: fileData.name,
					file_type: fileData.type,
					file_location: storageLocation,
				});
			}
		}

		// Fetch all files for this note to return up-to-date list
		const allFiles = await db
			.select()
			.from(tabFiles)
			.where(
				and(eq(tabFiles.tabNotesId, params.noteUid), eq(tabFiles.active, true)),
			);

		const safeTimeStampIso = (
			currentNote.timeStamp ? new Date(currentNote.timeStamp) : new Date()
		).toISOString();
		const completeNote: TabNoteRecord = {
			uid: params.noteUid,
			time_stamp: safeTimeStampIso,
			notes: params.notes,
			tab_type: currentNote.tabType ?? "",
			files: allFiles.map((f) => ({
				uid: f.uid,
				file_name: f.fileName,
				file_type: f.fileType,
				file_location: f.fileLocation,
			})),
		};

		await logger.info(
			"api/files/[uid]/other_fn.ts",
			"Note updated successfully",
		);
		return { data: completeNote, status: 200 };
	} catch (error) {
		await logger.error(
			"api/files/[uid]/other_fn.ts",
			`Error updating note: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
		return { error: "Failed to update note", status: 500 };
	}
}

// Soft delete a note and its files
export async function deleteNote(params: {
	orgId: string;
	noteUid: string;
}): Promise<DbWriteResponse<null>> {
	const logger = Logger.getInstance();
	await logger.init();

	try {
		await logger.info("api/files/[uid]/other_fn.ts", "Deleting note");

		// Fetch active file locations for this note to remove from storage
		const filesToDelete = await db
			.select({ loc: tabFiles.fileLocation })
			.from(tabFiles)
			.where(
				and(eq(tabFiles.tabNotesId, params.noteUid), eq(tabFiles.active, true)),
			);

		const filePaths = filesToDelete
			.map((f) => f.loc)
			.filter((p): p is string => typeof p === "string" && p.length > 0);

		if (filePaths.length > 0) {
			const { data: removed, error: removeError } = await supabase.storage
				.from(getBucket("ATTACHMENTS"))
				.remove(filePaths);

			if (removeError) {
				await logger.error(
					"api/files/[uid]/other_fn.ts",
					`Failed to remove ${filePaths.length} storage object(s): ${removeError.message}`,
				);
			} else {
				await logger.info(
					"api/files/[uid]/other_fn.ts",
					`Removed ${removed?.length ?? 0} storage object(s) for note ${params.noteUid}`,
				);
			}
		}

		// Hard delete files first
		await db
			.delete(tabFiles)
			.where(
				and(
					eq(tabFiles.tabNotesId, params.noteUid),
					eq(tabFiles.orgid, params.orgId),
				),
			);

		// Hard delete note
		await db
			.delete(tabNotes)
			.where(
				and(eq(tabNotes.uid, params.noteUid), eq(tabNotes.orgid, params.orgId)),
			);

		await logger.info("api/files/[uid]/other_fn.ts", "Note deleted");
		return { data: null, status: 200 };
	} catch (error) {
		await logger.error(
			"api/files/[uid]/other_fn.ts",
			`Error deleting note: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
		return { error: "Failed to delete note", status: 500 };
	}
}

// Generate a short-lived signed URL for a note attachment after validating org ownership
export async function getSignedFileUrl(params: {
	orgId: string;
	fileLocation: string;
}): Promise<DbWriteResponse<string>> {
	const logger = Logger.getInstance();
	await logger.init();

	try {
		await logger.info("api/files/[uid]/other_fn.ts", "Generating signed URL");

		// Validate that the file belongs to this org and is active
		const rows = await db
			.select()
			.from(tabFiles)
			.where(
				and(
					eq(tabFiles.orgid, params.orgId),
					eq(tabFiles.fileLocation, params.fileLocation),
					eq(tabFiles.active, true),
				),
			)
			.limit(1);

		if (!rows[0]) {
			await logger.warning(
				"api/files/[uid]/other_fn.ts",
				`Attachment not found or not accessible: ${params.fileLocation}`,
			);
			return { error: "Attachment not found", status: 404 };
		}

		// Create a signed URL valid for 5 minutes
		const { data, error } = await supabase.storage
			.from(getBucket("ATTACHMENTS"))
			.createSignedUrl(params.fileLocation, 60 * 5);

		if (error || !data?.signedUrl) {
			await logger.error(
				"api/files/[uid]/other_fn.ts",
				`Failed to create signed URL: ${error?.message ?? "Unknown error"}`,
			);
			return { error: "Failed to create signed URL", status: 500 };
		}

		return { data: data.signedUrl, status: 200 };
	} catch (error) {
		await logger.error(
			"api/files/[uid]/other_fn.ts",
			`Error generating signed URL: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
		return { error: "Failed to create signed URL", status: 500 };
	}
}
