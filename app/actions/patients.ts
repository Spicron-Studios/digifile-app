'use server';

import { auth } from '@/app/lib/auth';
import { Logger } from '@/app/lib/logger/logger.service';
import { patientQueries } from '@/db/queries';
import {
  PatientListItem,
  PatientFilters,
  PaginatedPatients,
  PatientWithFiles,
  CreatePatientData,
} from '@/app/types/patient';

const logger = Logger.getInstance();

export async function getPatients(
  page: number = 1,
  searchTerm?: string,
  filters?: PatientFilters,
  orderBy: 'lastEdit' | 'name' | 'dateOfBirth' = 'lastEdit'
): Promise<PaginatedPatients> {
  await logger.init();

  const session = await auth();
  if (!session?.user?.orgId) {
    await logger.warning('actions/patients.ts', 'Unauthorized: missing orgId');
    return {
      patients: [],
      total: 0,
      page: 1,
      limit: 30,
      totalPages: 0,
    };
  }

  await logger.info(
    'actions/patients.ts',
    `Fetching patients for orgId=${session.user.orgId}, page=${page}, search=${searchTerm}`
  );

  try {
    // CRITICAL: Always filter by organization ID
    const result = await patientQueries.getWithPagination(
      session.user.orgId,
      page,
      30,
      searchTerm,
      filters,
      orderBy
    );

    await logger.info(
      'actions/patients.ts',
      `Returning ${result.patients.length} patients (total: ${result.total})`
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
      'actions/patients.ts',
      `Error fetching patients: ${error instanceof Error ? error.message : 'Unknown error'}`
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
  uid: string
): Promise<PatientWithFiles | null> {
  await logger.init();

  const session = await auth();
  if (!session?.user?.orgId) {
    await logger.warning('actions/patients.ts', 'Unauthorized: missing orgId');
    return null;
  }

  await logger.info(
    'actions/patients.ts',
    `Fetching patient uid=${uid} for orgId=${session.user.orgId}`
  );

  try {
    // CRITICAL: Verify patient belongs to user's organization
    const results = await patientQueries.getPatientWithFiles(
      uid,
      session.user.orgId
    );

    if (!results || results.length === 0) {
      await logger.warning(
        'actions/patients.ts',
        `Patient ${uid} not found or does not belong to organization ${session.user.orgId}`
      );
      return null;
    }

    // Extract patient data and files
    const firstResult = results[0];
    if (!firstResult) {
      await logger.warning(
        'actions/patients.ts',
        `No patient data found for uid=${uid}`
      );
      return null;
    }

    const patientData = firstResult.patient;
    const files = results
      .filter(r => r.file && r.file.uid !== null)
      .map(r => ({
        uid: r.file!.uid!,
        file_number: r.file!.fileNumber || '',
        account_number: r.file!.accountNumber || '',
        lastEdit: r.file!.lastEdit || '',
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
      'actions/patients.ts',
      `Returning patient ${uid} with ${files.length} linked files`
    );

    return patient;
  } catch (error) {
    await logger.error(
      'actions/patients.ts',
      `Error fetching patient: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return null;
  }
}

export async function createPatient(
  data: CreatePatientData
): Promise<{ success: boolean; patient?: PatientWithFiles; error?: string }> {
  await logger.init();

  const session = await auth();
  if (!session?.user?.orgId) {
    await logger.warning('actions/patients.ts', 'Unauthorized: missing orgId');
    return { success: false, error: 'Unauthorized' };
  }

  // Validate required fields
  if (!data.name || !data.dateOfBirth) {
    return {
      success: false,
      error: 'Name and date of birth are required',
    };
  }

  // If not under 18, ID is required
  if (!data.isUnder18 && !data.id) {
    return {
      success: false,
      error: 'ID is required for patients 18 years or older',
    };
  }

  await logger.info(
    'actions/patients.ts',
    `Creating patient for orgId=${session.user.orgId}`
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
      return { success: false, error: 'Failed to create patient' };
    }

    const created = newPatient[0];
    if (!created) {
      return { success: false, error: 'Failed to create patient' };
    }

    await logger.info(
      'actions/patients.ts',
      `Created patient uid=${created.uid}`
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

    const result: any = {
      success: true,
      patient: patientWithFiles,
    };

    return result;
  } catch (error) {
    await logger.error(
      'actions/patients.ts',
      `Error creating patient: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to create patient',
    };
  }
}

export async function updatePatient(
  uid: string,
  data: Partial<CreatePatientData>
): Promise<{ success: boolean; patient?: PatientWithFiles; error?: string }> {
  await logger.init();

  const session = await auth();
  if (!session?.user?.orgId) {
    await logger.warning('actions/patients.ts', 'Unauthorized: missing orgId');
    return { success: false, error: 'Unauthorized' };
  }

  await logger.info(
    'actions/patients.ts',
    `Updating patient uid=${uid} for orgId=${session.user.orgId}`
  );

  try {
    // CRITICAL: First verify patient belongs to user's organization
    const existing = await patientQueries.getPatientWithFiles(
      uid,
      session.user.orgId
    );

    if (!existing || existing.length === 0) {
      await logger.warning(
        'actions/patients.ts',
        `Patient ${uid} not found or does not belong to organization ${session.user.orgId}`
      );
      return {
        success: false,
        error: 'Patient not found or access denied',
      };
    }

    // Update patient
    const updated = await patientQueries.updatePatient(uid, {
      name: data.name || undefined,
      surname: data.surname || undefined,
      dateOfBirth: data.dateOfBirth || undefined,
      id: data.id || undefined,
      title: data.title || undefined,
      gender: data.gender || undefined,
      cellPhone: data.cellPhone || undefined,
      email: data.email || undefined,
      address: data.address || undefined,
    });

    if (!updated || updated.length === 0) {
      return { success: false, error: 'Failed to update patient' };
    }

    // Get updated patient with files
    const patientWithFiles = await getPatient(uid);

    await logger.info('actions/patients.ts', `Updated patient uid=${uid}`);

    if (patientWithFiles) {
      return {
        success: true,
        patient: patientWithFiles,
      };
    } else {
      return {
        success: true,
      };
    }
  } catch (error) {
    await logger.error(
      'actions/patients.ts',
      `Error updating patient: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to update patient',
    };
  }
}
