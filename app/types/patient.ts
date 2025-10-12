export interface PatientListItem {
  uid: string;
  id: string | null;
  name: string | null;
  surname: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  email: string | null;
  lastEdit: string | null;
}

export interface PatientFilters {
  hasId?: boolean;
  hasDob?: boolean;
  dobFrom?: string;
  dobTo?: string;
  gender?: string;
}

export interface PatientFile {
  uid: string;
  file_number: string;
  account_number: string;
  lastEdit: string;
}

export interface PatientWithFiles {
  uid: string;
  id?: string | null;
  title?: string | null;
  name?: string | null;
  initials?: string | null;
  surname?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  cellPhone?: string | null;
  email?: string | null;
  address?: string | null;
  additionalName?: string | null;
  additionalCell?: string | null;
  lastEdit?: string | null;
  files: PatientFile[];
}

export interface CreatePatientData {
  name: string;
  surname?: string;
  dateOfBirth: string;
  id?: string;
  isUnder18?: boolean;
  title?: string;
  gender?: string;
  cellPhone?: string;
  email?: string;
  address?: string;
}

export interface PaginatedPatients {
  patients: PatientListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
