export interface Patient {
  uid?: string;
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

export interface MedicalAid {
  scheme_id?: string;
  name?: string;
  membership_number?: string;
  dependent_code?: string;
}

export interface Member {
  uid?: string;
  id?: string;
  title?: string;
  name?: string;
  initials?: string;
  surname?: string;
  dob?: string;
  gender?: string;
  cell?: string;
}

export interface InjuryOnDuty {
  company_name?: string;
  contact_person?: string;
  contact_number?: string;
  contact_email?: string;
}

export interface MedicalCover {
  type?: string;
  same_as_patient?: boolean;
  medical_aid?: MedicalAid;
  member?: Member;
  injury_on_duty?: InjuryOnDuty;
}

export interface FileNote {
  uid?: string;
  time_stamp?: string;
  content?: string;
  files?: NoteFile[];
}

export interface NoteFile {
  uid?: string;
  name?: string;
  type?: string;
  size?: number;
  content?: string;
}

export interface FileNotes {
  file_notes?: FileNote[];
  clinical_notes?: FileNote[];
}

export interface FileInfoPatient {
  uid?: string;
  patientid?: string;
}

export interface FileData {
  uid?: string;
  file_number?: string;
  account_number?: string;
  orgid?: string;
  patient?: Patient;
  medical_cover?: MedicalCover;
  notes?: FileNotes;
  fileinfo_patient?: FileInfoPatient[];
  extraInfo?: string;
}

export interface MedicalScheme {
  uid: string;
  scheme_name: string;
}

export interface DateParts {
  year: string;
  month: string;
  day: string;
}

export interface UploadedFile {
  name: string;
  type: string;
  size: number;
  content: string | ArrayBuffer | null;
}

export type HandleInputChange = (_field: string, _value: string) => void;
export type HandleSelectChange = (_field: string, _value: string) => void;

// For internal processing in db_read.ts
export interface ProcessingNoteFile {
  uid: string;
  fileName: string | null;
  fileType: string | null;
  fileLocation: string | null;
}

export interface ProcessingNoteWithFiles {
  uid: string;
  timeStamp: string | null;
  notes: string | null;
  tabType: string | null;
  tab_files: ProcessingNoteFile[];
}

// For API response
export interface ApiNoteFile {
  uid: string;
  file_name: string | null;
  file_type: string | null;
  file_location: string | null;
}

export interface ApiFileNote {
  uid: string;
  time_stamp: string | null;
  notes: string | null;
  tab_type: string | null;
  files: ApiNoteFile[];
}
