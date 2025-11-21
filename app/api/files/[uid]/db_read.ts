import db, {
	fileInfo,
	fileinfoPatient,
	patient,
	patientMedicalAid,
	medicalScheme,
	injuryOnDuty,
	tabNotes,
	tabFiles,
} from "@/app/lib/drizzle";
import { Logger } from "@/app/lib/logger/logger.service";
import type {
	ApiFileNote,
	ProcessingNoteWithFiles,
} from "@/app/types/file-data";
import { and, desc, eq } from "drizzle-orm";
import { fetchMedicalSchemes } from "./other_fn";

// Handle GET requests for file data
export async function handleGetFileData(uid: string, orgId: string) {
	const logger = Logger.getInstance();
	await logger.init();

	try {
		await logger.info(
			"api/files/[uid]/db_read.ts",
			`Getting file data for UID: ${uid}`,
		);

		// Fetch medical schemes
		const medicalSchemes = await fetchMedicalSchemes(orgId);
		await logger.debug(
			"api/files/[uid]/db_read.ts",
			`🏥 API: Fetched ${medicalSchemes.length} medical schemes`,
		);

		// For new files or if no uid is provided, return a template
		if (!uid || uid === "new") {
			await logger.debug(
				"api/files/[uid]/db_read.ts",
				"📄 API: New file template requested",
			);
			return {
				data: {
					uid: "",
					file_number: "",
					account_number: "",
					patient: {
						uid: "",
						id: "",
						title: "",
						name: "",
						initials: "",
						surname: "",
						dob: "",
						gender: "",
						cell_phone: "",
						additional_name: "",
						additional_cell: "",
						email: "",
						address: "",
					},
					medical_cover: {
						type: "medical-aid",
						same_as_patient: false,
						member: {
							id: "",
							name: "",
							initials: "",
							surname: "",
							dob: "",
							cell: "",
							email: "",
							address: "",
						},
						medical_aid: {
							scheme_id: "",
							name: "",
							membership_number: "",
							dependent_code: "",
						},
					},
					notes: {
						file_notes: [],
						clinical_notes: [],
					},
					fileinfo_patient: [],
					medical_schemes: medicalSchemes, // Added medical schemes to response
				},
				status: 200,
			};
		}

		await logger.info(
			"api/files/[uid]/db_read.ts",
			`🏢 API: Fetching file with UID: ${uid}`,
		);

		// Find the file info record with expanded relationships using multiple queries
		// Start with the main file info
		const fileInfoResult = await db
			.select()
			.from(fileInfo)
			.where(
				and(
					eq(fileInfo.uid, uid),
					eq(fileInfo.active, true),
					eq(fileInfo.orgid, orgId),
				),
			)
			.limit(1);

		if (fileInfoResult.length === 0) {
			await logger.warning(
				"api/files/[uid]/db_read.ts",
				`📭 API: File with UID ${uid} not found`,
			);
			return { error: "File not found", status: 404 };
		}

		const fileInfoRecord = fileInfoResult[0];
		if (!fileInfoRecord) {
			await logger.warning(
				"api/files/[uid]/db_read.ts",
				`📭 API: File with UID ${uid} not found`,
			);
			return { error: "File not found", status: 404 };
		}

		// Get file-patient relationships
		const filePatientResults = await db
			.select({
				filePatient: fileinfoPatient,
				patient: patient,
			})
			.from(fileinfoPatient)
			.innerJoin(patient, eq(fileinfoPatient.patientid, patient.uid))
			.where(
				and(
					eq(fileinfoPatient.fileid, fileInfoRecord.uid),
					eq(fileinfoPatient.active, true),
					eq(patient.active, true),
					eq(fileinfoPatient.orgid, orgId),
				),
			);

		// Get medical aid info
		const medicalAidResults = await db
			.select({
				medicalAid: patientMedicalAid,
				scheme: medicalScheme,
			})
			.from(patientMedicalAid)
			.leftJoin(
				medicalScheme,
				eq(patientMedicalAid.medicalSchemeId, medicalScheme.uid),
			)
			.where(
				and(
					eq(patientMedicalAid.fileid, fileInfoRecord.uid),
					eq(patientMedicalAid.active, true),
					eq(patientMedicalAid.orgid, orgId),
				),
			);

		// Get injury on duty info
		const injuryResults = await db
			.select()
			.from(injuryOnDuty)
			.where(
				and(
					eq(injuryOnDuty.fileid, fileInfoRecord.uid),
					eq(injuryOnDuty.active, true),
					eq(injuryOnDuty.orgid, orgId),
				),
			);

		// Get notes and files if we have file patients
		let notesAndFiles: Array<{
			note: typeof tabNotes.$inferSelect;
			file: typeof tabFiles.$inferSelect | null;
		}> = [];
		if (filePatientResults.length > 0) {
			const filePatientId = filePatientResults[0]?.filePatient.uid;
			if (filePatientId) {
				notesAndFiles = await db
					.select({
						note: tabNotes,
						file: tabFiles,
					})
					.from(tabNotes)
					.leftJoin(
						tabFiles,
						and(
							eq(tabFiles.tabNotesId, tabNotes.uid),
							eq(tabFiles.active, true),
						),
					)
					.where(
						and(
							eq(tabNotes.fileinfoPatientId, filePatientId),
							eq(tabNotes.active, true),
							eq(tabNotes.orgid, orgId),
						),
					)
					.orderBy(desc(tabNotes.timeStamp));
			}
		}

		// Process the results to match original structure
		const processedFileInfo = {
			uid: fileInfoRecord.uid,
			fileNumber: fileInfoRecord.fileNumber,
			accountNumber: fileInfoRecord.accountNumber,
			fileinfo_patient: filePatientResults.map((fp) => ({
				...fp.filePatient,
				patient: fp.patient,
				tab_notes: [] as ProcessingNoteWithFiles[], // Will be populated below
			})),
			patient_medical_aid: medicalAidResults.map((ma) => ({
				...ma.medicalAid,
				medical_scheme: ma.scheme,
				patientmedicalaid_file_patient: [] as unknown[], // Simplified for now
			})),
			injury_on_duty: injuryResults,
		};

		// Group notes and files
		const notesMap = new Map<string, ProcessingNoteWithFiles>();

		notesAndFiles.forEach((nf) => {
			if (!notesMap.has(nf.note.uid)) {
				notesMap.set(nf.note.uid, {
					uid: nf.note.uid,
					timeStamp: nf.note.timeStamp,
					notes: nf.note.notes,
					tabType: nf.note.tabType,
					tab_files: [],
				});
			}
			if (nf.file) {
				notesMap.get(nf.note.uid)?.tab_files.push({
					uid: nf.file.uid,
					fileName: nf.file.fileName,
					fileType: nf.file.fileType,
					fileLocation: nf.file.fileLocation,
				});
			}
		});

		// Add notes to the first file patient
		if (
			processedFileInfo.fileinfo_patient.length > 0 &&
			processedFileInfo.fileinfo_patient[0]
		) {
			processedFileInfo.fileinfo_patient[0].tab_notes = Array.from(
				notesMap.values(),
			);
		}

		if (!processedFileInfo) {
			await logger.warning(
				"api/files/[uid]/db_read.ts",
				`📭 API: File with UID ${uid} not found`,
			);
			return { error: "File not found", status: 404 };
		}

		// Get the first linked patient if it exists
		const filePatient =
			processedFileInfo.fileinfo_patient.length > 0
				? processedFileInfo.fileinfo_patient[0]
				: null;
		const patientData = filePatient?.patient || null;

		// Get medical aid info if it exists
		const medicalAid =
			processedFileInfo.patient_medical_aid.length > 0
				? processedFileInfo.patient_medical_aid[0]
				: null;

		// Get injury on duty info if it exists
		const injuryOnDutyData =
			processedFileInfo.injury_on_duty.length > 0
				? processedFileInfo.injury_on_duty[0]
				: null;

		// Determine cover type based on available data
		let coverType = "private"; // Default
		if (medicalAid) {
			coverType = "medical-aid";
		} else if (injuryOnDutyData) {
			coverType = "injury-on-duty";
		}

		// For simplicity, assume medical aid member is same as patient for now
		// The complex member patient lookup would require additional queries
		let isSameAsPatient = false;
		if (medicalAid) {
			isSameAsPatient = true;
		}

		// Format member date of birth if exists
		// Simplified - no member patient data for now

		// Process tab_notes and tab_files
		// Separate notes by type (file_notes or clinical_notes)
		const fileNotes: ApiFileNote[] = [];
		const clinicalNotes: ApiFileNote[] = [];

		// If filePatient exists, we can collect its tab_notes
		if (filePatient && filePatient.tab_notes) {
			for (const note of filePatient.tab_notes) {
				const noteObj: ApiFileNote = {
					uid: note.uid,
					time_stamp: note.timeStamp,
					notes: note.notes,
					tab_type: note.tabType,
					files: note.tab_files.map((file) => ({
						uid: file.uid,
						file_name: file.fileName,
						file_type: file.fileType,
						file_location: file.fileLocation,
					})),
				};

				// Sort notes based on tab_type
				if (note.tabType === "file") {
					fileNotes.push(noteObj);
				} else if (note.tabType === "clinical") {
					clinicalNotes.push(noteObj);
				}
			}
		}

		await logger.debug(
			"api/files/[uid]/db_read.ts",
			`📝 API: Fetched ${fileNotes.length} file notes and ${clinicalNotes.length} clinical notes`,
		);

		// Return the file data with expanded fields
		const fileData = {
			uid: processedFileInfo.uid,
			file_number: processedFileInfo.fileNumber || "",
			account_number: processedFileInfo.accountNumber || "",
			patient: {
				uid: patientData?.uid || "",
				id: patientData?.id || "",
				title: patientData?.title || "",
				name: patientData?.name || "",
				initials: patientData?.initials || "",
				surname: patientData?.surname || "",
				dob: patientData?.dateOfBirth
					? `${new Date(patientData.dateOfBirth).getFullYear()}/${String(new Date(patientData.dateOfBirth).getMonth() + 1).padStart(2, "0")}/${String(new Date(patientData.dateOfBirth).getDate()).padStart(2, "0")}`
					: "",
				gender: patientData?.gender || "",
				cell_phone: patientData?.cellPhone || "",
				additional_name: patientData?.additionalName || "",
				additional_cell: patientData?.additionalCell || "",
				email: patientData?.email || "",
				address: patientData?.address || "",
			},
			medical_cover: {
				type: coverType,
				same_as_patient: isSameAsPatient,
				member: {
					id: "",
					name: "",
					initials: "",
					surname: "",
					dob: "",
					cell: "",
					email: "",
					address: "",
				},
				medical_aid: medicalAid
					? {
							scheme_id: medicalAid.medicalSchemeId || "",
							name: medicalAid.medical_scheme?.schemeName || "",
							membership_number: medicalAid.membershipNumber || "",
							dependent_code: medicalAid.patientDependantCode || "",
						}
					: {
							scheme_id: "",
							name: "",
							membership_number: "",
							dependent_code: "",
						},
				injury_on_duty: injuryOnDutyData
					? {
							company_name: injuryOnDutyData.companyName || "",
							contact_person: injuryOnDutyData.contactPerson || "",
							contact_number: injuryOnDutyData.contactNumber || "",
							contact_email: injuryOnDutyData.contactEmail || "",
						}
					: {
							company_name: "",
							contact_person: "",
							contact_number: "",
							contact_email: "",
						},
			},
			notes: {
				file_notes: fileNotes,
				clinical_notes: clinicalNotes,
			},
			fileinfo_patient:
				processedFileInfo.fileinfo_patient.map((fp) => ({
					uid: fp.uid,
					patientid: fp.patientid,
				})) || [],
			medical_schemes: medicalSchemes, // From existing code
		};

		await logger.info(
			"api/files/[uid]/db_read.ts",
			"✅ API: File data retrieved successfully",
		);
		await logger.debug(
			"api/files/[uid]/db_read.ts",
			JSON.stringify(fileData, null, 2),
		);

		return { data: fileData, status: 200 };
	} catch (error) {
		await logger.error(
			"api/files/[uid]/db_read.ts",
			`💥 API: Error fetching file: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
		return { error: "Failed to fetch file", status: 500 };
	}
}
