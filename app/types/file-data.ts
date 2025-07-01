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

export type HandleInputChange = (field: string, value: string) => void;
export type HandleSelectChange = (field: string, value: string) => void;
