// Types for database operations in db_write.ts

export interface PatientData {
	id?: string;
	title?: string;
	name?: string;
	initials?: string;
	surname?: string;
	dob?: string;
	gender?: string;
	cell_phone?: string;
	additional_name?: string;
	additional_cell?: string;
	email?: string;
	address?: string;
}

export interface MedicalAidData {
	scheme_id?: string;
	membership_number?: string;
	dependent_code?: string;
}

export interface MemberData {
	id?: string;
	title?: string;
	name?: string;
	initials?: string;
	surname?: string;
	dob?: string;
	gender?: string;
	cell?: string;
	email?: string;
	address?: string;
}

export interface InjuryOnDutyData {
	company_name?: string;
	contact_person?: string;
	contact_number?: string;
	contact_email?: string;
}

export interface MedicalCoverData {
	type?: string;
	same_as_patient?: boolean;
	medical_aid?: MedicalAidData;
	member?: MemberData;
	injury_on_duty?: InjuryOnDutyData;
}

export interface FileUpdateData {
	file_number?: string;
	account_number?: string;
	referral_doc_name?: string;
	referral_doc_number?: string;
	patient?: PatientData;
	medical_cover?: MedicalCoverData;
}

export type FileCreateData = FileUpdateData;

export interface NoteFileData {
	name: string;
	type: string;
	content: string;
}

export interface NoteData {
	orgId: string;
	fileInfoPatientId: string;
	patientId: string;
	timeStamp: string;
	notes: string;
	tabType: string;
	files?: NoteFileData[];
}

// Smart note creation that can work with just file UID and patient ID number
export interface SmartNoteData {
	orgId: string;
	fileUid: string;
	// Patient national ID number (the `patient.id` field). Required if no file-patient link exists yet
	patientIdNumber?: string | undefined;
	timeStamp: string;
	notes: string;
	tabType: string;
	files?: NoteFileData[];
}

export interface TabNoteRecord {
	uid: string;
	time_stamp: string;
	notes: string;
	tab_type: string;
	files: Array<{
		uid: string;
		file_name: string | null;
		file_type: string | null;
		file_location: string | null;
	}>;
}

export interface DbWriteResponse<T = unknown> {
	data?: T;
	error?: string;
	status: number;
}
