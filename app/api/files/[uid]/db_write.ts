import db, {
  fileInfo,
  fileinfoPatient,
  patient,
  patientMedicalAid,
  injuryOnDuty,
  patientmedicalaidFilePatient,
} from '@/app/lib/drizzle';
import { and, eq } from 'drizzle-orm';
import { Logger } from '@/app/lib/logger/logger.service';
import { v4 as uuidv4 } from 'uuid';
import {
  FileUpdateData,
  FileCreateData,
  MemberData,
  InjuryOnDutyData,
  DbWriteResponse,
} from '@/app/types/db-types';
import { handleGetFileData } from './db_read';

// Handle PUT requests to update an existing file
export async function handleUpdateFile(
  uid: string,
  data: FileUpdateData,
  orgId: string
): Promise<DbWriteResponse> {
  const logger = Logger.getInstance();
  await logger.init();

  try {
    await logger.checkpoint(
      'api/files/[uid]/db_write.ts',
      '--- Starting handleUpdateFile ---'
    );
    await logger.info(
      'api/files/[uid]/db_write.ts',
      `Updating file with UID: ${uid}`
    );
    await logger.debug(
      'api/files/[uid]/db_write.ts',
      `Received data: ${JSON.stringify(data, null, 2)}`
    );

    await logger.info(
      'api/files/[uid]/db_write.ts',
      `Updating file with UID: ${uid}`
    );

    // Log the full received data object for debugging
    await logger.debug(
      'api/files/[uid]/db_write.ts',
      `RECEIVED DATA OBJECT: ${JSON.stringify(data, null, 2)}`
    );

    // The uid from params is our identifier for file_info
    const fileUid = uid;

    // First, check if the file_info record exists
    const existingFileInfo = await db
      .select({
        fileInfo: fileInfo,
        filePatient: fileinfoPatient,
        patient: patient,
      })
      .from(fileInfo)
      .leftJoin(
        fileinfoPatient,
        and(
          eq(fileinfoPatient.fileid, fileInfo.uid),
          eq(fileinfoPatient.active, true)
        )
      )
      .leftJoin(patient, eq(fileinfoPatient.patientid, patient.uid))
      .where(eq(fileInfo.uid, fileUid))
      .limit(1);

    const existingRecord = existingFileInfo[0];

    await logger.debug(
      'api/files/[uid]/db_write.ts',
      `Existing file_info found: ${!!existingRecord}`
    );
    if (existingRecord) {
      await logger.debug(
        'api/files/[uid]/db_write.ts',
        `Has fileinfo_patient relationships: ${!!existingRecord.filePatient}`
      );
    }

    // Upsert the file_info record
    let _upsertedFileInfo;
    if (existingRecord?.fileInfo) {
      // Update existing
      const updated = await db
        .update(fileInfo)
        .set({
          fileNumber: data.file_number,
          accountNumber: data.account_number,
          referralDocName: data.referral_doc_name,
          referralDocNumber: data.referral_doc_number,
          lastEdit: new Date().toISOString(),
        })
        .where(eq(fileInfo.uid, fileUid))
        .returning();
      _upsertedFileInfo = updated[0];
    } else {
      // Create new
      const created = await db
        .insert(fileInfo)
        .values({
          uid: fileUid,
          fileNumber: data.file_number || '',
          accountNumber: data.account_number || '',
          referralDocName: data.referral_doc_name || '',
          referralDocNumber: data.referral_doc_number || '',
          orgid: orgId,
          active: true,
          dateCreated: new Date().toISOString(),
          lastEdit: new Date().toISOString(),
        })
        .returning();
      _upsertedFileInfo = created[0];
    }

    if (!_upsertedFileInfo) {
      throw new Error('Failed to upsert file info');
    }

    await logger.info(
      'api/files/[uid]/db_write.ts',
      `File_info upserted with UID: ${_upsertedFileInfo.uid}`
    );

    // Process patient information if provided
    if (data.patient) {
      await logger.debug(
        'api/files/[uid]/db_write.ts',
        'Processing patient data'
      );

      // Parse date of birth if provided (avoid timezone conversion)
      let dobDate: string | null = null;
      if (data.patient.dob) {
        const dobParts = data.patient.dob.split('/');
        if (dobParts.length === 3) {
          const year = String(dobParts[0] || '').padStart(4, '0');
          const month = String(dobParts[1] || '').padStart(2, '0');
          const day = String(dobParts[2] || '').padStart(2, '0');
          dobDate = `${year}-${month}-${day}`;
        }
      }

      // Find existing fileinfo_patient relationship if any
      const existingRelation = existingRecord?.filePatient || null;
      const existingPatient = existingRecord?.patient || null;

      if (existingRelation && existingPatient) {
        await logger.debug(
          'api/files/[uid]/db_write.ts',
          `Found existing patient relationship with UID: ${existingPatient.uid}`
        );
      }

      // Decide whether to update existing patient or create new one
      if (existingPatient) {
        await logger.debug(
          'api/files/[uid]/db_write.ts',
          `Patient data being updated: ${JSON.stringify(
            {
              id: data.patient.id,
              title: data.patient.title,
              name: data.patient.name,
              surname: data.patient.surname,
              dateOfBirth: dobDate,
            },
            null,
            2
          )}`
        );

        // Update existing patient
        await logger.debug(
          'api/files/[uid]/db_write.ts',
          `Updating existing patient with UID: ${existingPatient.uid}`
        );

        const updateResult = await db
          .update(patient)
          .set({
            id: data.patient.id, // This was missing!
            title: data.patient.title,
            name: data.patient.name,
            initials: data.patient.initials,
            surname: data.patient.surname,
            dateOfBirth: dobDate,
            gender: data.patient.gender,
            cellPhone: data.patient.cell_phone,
            additionalName: data.patient.additional_name,
            additionalCell: data.patient.additional_cell,
            email: data.patient.email,
            address: data.patient.address,
            lastEdit: new Date().toISOString(),
          })
          .where(eq(patient.uid, existingPatient.uid))
          .returning();

        await logger.debug(
          'api/files/[uid]/db_write.ts',
          `Patient update result: ${JSON.stringify(updateResult)}`
        );

        await logger.info(
          'api/files/[uid]/db_write.ts',
          'Existing patient updated'
        );
      } else if (data.patient.name || data.patient.surname || data.patient.id) {
        await logger.info(
          'api/files/[uid]/db_write.ts',
          'Creating new patient and relationship...'
        );
        // Create new patient and relationship
        const newPatientUid = uuidv4();
        await logger.info(
          'api/files/[uid]/db_write.ts',
          `Creating new patient with UID: ${newPatientUid}`
        );

        // Create the patient record
        await db.insert(patient).values({
          uid: newPatientUid,
          id: data.patient.id || '',
          title: data.patient.title || '',
          name: data.patient.name || '',
          initials: data.patient.initials || '',
          surname: data.patient.surname || '',
          dateOfBirth: dobDate,
          gender: data.patient.gender || '',
          cellPhone: data.patient.cell_phone || '',
          additionalName: data.patient.additional_name || '',
          additionalCell: data.patient.additional_cell || '',
          email: data.patient.email || '',
          address: data.patient.address || '',
          orgid: orgId,
          active: true,
          dateCreated: new Date().toISOString(),
          lastEdit: new Date().toISOString(),
        });

        // Create the fileinfo_patient relationship
        const newRelationUid = uuidv4();
        await logger.info(
          'api/files/[uid]/db_write.ts',
          `Creating fileinfo_patient relationship with UID: ${newRelationUid}`
        );

        await db.insert(fileinfoPatient).values({
          uid: newRelationUid,
          fileid: fileUid,
          patientid: newPatientUid,
          orgid: orgId,
          active: true,
          dateCreated: new Date().toISOString(),
          lastEdit: new Date().toISOString(),
        });

        await logger.info(
          'api/files/[uid]/db_write.ts',
          'New patient and relationship created successfully'
        );
      }
    }

    // Process medical cover information
    if (data.medical_cover) {
      await logger.debug(
        'api/files/[uid]/db_write.ts',
        'Processing medical cover data'
      );

      // Handle based on medical cover type
      if (data.medical_cover.type === 'medical-aid') {
        // Handle medical aid type
        await processMedicalAid(fileUid, data.medical_cover, orgId);
      } else if (
        data.medical_cover.type === 'injury-on-duty' &&
        data.medical_cover.injury_on_duty
      ) {
        // Handle injury on duty type
        await processInjuryOnDuty(
          fileUid,
          data.medical_cover.injury_on_duty,
          orgId
        );
      }
      // For 'private' type, no additional records needed
    }

    await logger.info(
      'api/files/[uid]/db_write.ts',
      'File update completed successfully'
    );
    // Fetch the updated file data to return
    await logger.debug(
      'api/files/[uid]/db_write.ts',
      `Refetching data for file UID: ${fileUid}`
    );
    const result = await handleGetFileData(fileUid, orgId);
    await logger.debug(
      'api/files/[uid]/db_write.ts',
      `Data fetched after update: ${JSON.stringify(result.data, null, 2)}`
    );

    if (result.error) {
      await logger.error(
        'api/files/[uid]/db_write.ts',
        `Failed to fetch updated file data after update: ${result.error}`
      );
      return { error: 'File not found after update', status: 404 };
    }
    await logger.checkpoint(
      'api/files/[uid]/db_write.ts',
      '--- Finished handleUpdateFile ---'
    );

    return { data: result.data, status: 200 };
  } catch (error) {
    await logger.error(
      'api/files/[uid]/db_write.ts',
      `Error updating file: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return { error: 'Failed to update file', status: 500 };
  }
}

// Handle POST requests to create a new file
export async function handleCreateFile(
  data: FileCreateData,
  orgId: string
): Promise<DbWriteResponse> {
  const logger = Logger.getInstance();
  await logger.init();

  try {
    await logger.checkpoint(
      'api/files/[uid]/db_write.ts',
      '--- Starting handleCreateFile ---'
    );
    await logger.debug(
      'api/files/[uid]/db_write.ts',
      `Received data for new file: ${JSON.stringify(data, null, 2)}`
    );
    await logger.info('api/files/[uid]/db_write.ts', 'Creating new file');

    // Log the full received data object for debugging
    await logger.debug(
      'api/files/[uid]/db_write.ts',
      `RECEIVED DATA OBJECT FOR NEW FILE: ${JSON.stringify(data, null, 2)}`
    );

    // Generate a new UUID for this file
    const newFileUid = uuidv4();
    await logger.info(
      'api/files/[uid]/db_write.ts',
      `Generated new file UID: ${newFileUid}`
    );

    // Create the file_info record first
    const newFileInfo = await db
      .insert(fileInfo)
      .values({
        uid: newFileUid,
        fileNumber: data.file_number || '',
        accountNumber: data.account_number || '',
        referralDocName: data.referral_doc_name || null,
        referralDocNumber: data.referral_doc_number || null,
        orgid: orgId,
        active: true,
        dateCreated: new Date().toISOString(),
        lastEdit: new Date().toISOString(),
      })
      .returning();

    const newFileInfoRecord = newFileInfo[0];
    if (!newFileInfoRecord) {
      throw new Error('Failed to create file info');
    }

    await logger.info(
      'api/files/[uid]/db_write.ts',
      `New file_info created with UID: ${newFileInfoRecord.uid}`
    );

    // Create patient record if patient data is provided
    // Track created patient and relationship rows for downstream response shaping
    let newPatientRecord: typeof patient.$inferSelect | null = null;
    let newFilePatientRows: Array<typeof fileinfoPatient.$inferSelect> | null =
      null;

    if (
      data.patient &&
      (data.patient.id || data.patient.name || data.patient.surname)
    ) {
      await logger.debug(
        'api/files/[uid]/db_write.ts',
        'Processing patient data for new file'
      );

      // Updated validation: require either ID OR Name + DOB
      const hasId = !!data.patient.id && data.patient.id.trim() !== '';
      const hasNameDob =
        !!data.patient.name &&
        data.patient.name.trim() !== '' &&
        !!data.patient.dob &&
        data.patient.dob.trim() !== '';
      if (!hasId && !hasNameDob) {
        return {
          error:
            'Provide either Patient ID (adult) or Name and Date of Birth (child).',
          status: 400,
        };
      }

      // Parse date of birth if provided (avoid timezone conversion)
      let dobDate: string | null = null;
      if (data.patient.dob) {
        const dobParts = data.patient.dob.split('/');
        if (dobParts.length === 3) {
          const year = String(dobParts[0] || '').padStart(4, '0');
          const month = String(dobParts[1] || '').padStart(2, '0');
          const day = String(dobParts[2] || '').padStart(2, '0');
          dobDate = `${year}-${month}-${day}`;
        }
      }

      // Generate a new UUID for the patient
      const newPatientUid = uuidv4();
      await logger.info(
        'api/files/[uid]/db_write.ts',
        `Creating new patient with UID: ${newPatientUid}`
      );

      // Create the patient record
      const newPatient = await db
        .insert(patient)
        .values({
          uid: newPatientUid,
          id:
            data.patient.id && data.patient.id.trim() !== ''
              ? data.patient.id
              : null,
          title: data.patient.title || '',
          name: data.patient.name || '',
          initials: data.patient.initials || '',
          surname: data.patient.surname || '',
          dateOfBirth: dobDate,
          gender: data.patient.gender || '',
          cellPhone: data.patient.cell_phone || '',
          additionalName: data.patient.additional_name || '',
          additionalCell: data.patient.additional_cell || '',
          email: data.patient.email || '',
          address: data.patient.address || '',
          orgid: orgId,
          active: true,
          dateCreated: new Date().toISOString(),
          lastEdit: new Date().toISOString(),
        })
        .returning();

      const newPatientRecordLocal = newPatient[0];
      if (!newPatientRecordLocal) {
        throw new Error('Failed to create patient');
      }
      newPatientRecord = newPatientRecordLocal;

      await logger.info(
        'api/files/[uid]/db_write.ts',
        `Patient created with UID: ${newPatientRecord.uid}`
      );

      // Generate a new UUID for the relationship
      const relationshipUid = uuidv4();

      // Create the fileinfo_patient relationship
      const newFilePatientRowsLocal = await db
        .insert(fileinfoPatient)
        .values({
          uid: relationshipUid,
          fileid: newFileUid,
          patientid: newPatientUid,
          orgid: orgId,
          active: true,
          dateCreated: new Date().toISOString(),
          lastEdit: new Date().toISOString(),
        })
        .returning();

      newFilePatientRows = newFilePatientRowsLocal;

      if (!newFilePatientRowsLocal[0]) {
        throw new Error('Failed to create file-patient link');
      }

      await logger.info(
        'api/files/[uid]/db_write.ts',
        `fileinfo_patient relationship created with UID: ${relationshipUid}`
      );

      // Stored patient data object removed as it was unused
    }

    // Process medical cover information
    if (data.medical_cover) {
      await logger.debug(
        'api/files/[uid]/db_write.ts',
        'Processing medical cover data for new file'
      );

      // Handle based on medical cover type
      if (data.medical_cover.type === 'medical-aid') {
        // Handle medical aid type
        await processMedicalAid(newFileUid, data.medical_cover, orgId);
      } else if (
        data.medical_cover.type === 'injury-on-duty' &&
        data.medical_cover.injury_on_duty
      ) {
        // Handle injury on duty type
        await processInjuryOnDuty(
          newFileUid,
          data.medical_cover.injury_on_duty,
          orgId
        );
      }
      // For 'private' type, no additional records needed
    }

    await logger.info(
      'api/files/[uid]/db_write.ts',
      'New file created successfully'
    );
    // Fetch the created file data to return
    await logger.debug(
      'api/files/[uid]/db_write.ts',
      `Refetching data for new file UID: ${newFileUid}`
    );
    const result = await handleGetFileData(newFileUid, orgId);
    await logger.debug(
      'api/files/[uid]/db_write.ts',
      `Data fetched after create: ${JSON.stringify(result.data, null, 2)}`
    );
    if (result.error) {
      await logger.error(
        'api/files/[uid]/db_write.ts',
        `Failed to fetch created file data after create: ${result.error}`
      );
      return { error: 'File not found after create', status: 404 };
    }

    // Manually add the newly created fileinfo_patient to the response
    if (
      result.data &&
      !result.data.fileinfo_patient &&
      newPatientRecord &&
      newFilePatientRows &&
      newFilePatientRows[0]
    ) {
      result.data.fileinfo_patient = [
        {
          uid: newFilePatientRows[0].uid,
          patientid: newPatientRecord.uid,
        },
      ];
    }

    await logger.checkpoint(
      'api/files/[uid]/db_write.ts',
      '--- Finished handleCreateFile ---'
    );
    return { data: result.data, status: 200 };
  } catch (error) {
    await logger.error(
      'api/files/[uid]/db_write.ts',
      `Error creating new file: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return { error: 'Failed to create new file', status: 500 };
  }
}

// Helper function to process medical aid data
async function processMedicalAid(
  fileUid: string,
  medicalCover: import('@/app/types/db-types').MedicalCoverData,
  orgId: string
): Promise<void> {
  const logger = Logger.getInstance();
  await logger.init();

  try {
    await logger.debug(
      'api/files/[uid]/db_write.ts',
      `Processing medical aid data: ${JSON.stringify(medicalCover, null, 2)}`
    );
    await logger.debug(
      'api/files/[uid]/db_write.ts',
      'Processing medical aid data'
    );

    // Find existing medical aid record for this file if any
    const existingMedicalAid = await db
      .select()
      .from(patientMedicalAid)
      .where(
        and(
          eq(patientMedicalAid.fileid, fileUid),
          eq(patientMedicalAid.active, true)
        )
      )
      .limit(1);

    // Extract medical aid data
    const medicalAidData = medicalCover.medical_aid || {};
    const schemeId = medicalAidData.scheme_id;
    const membershipNumber = medicalAidData.membership_number || '';
    const dependentCode = medicalAidData.dependent_code || '';

    // If scheme ID is not provided, we can't proceed with creating/updating medical aid
    if (!schemeId) {
      await logger.warning(
        'api/files/[uid]/db_write.ts',
        'No scheme ID provided, skipping medical aid save'
      );
      return;
    }

    // Upsert medical aid record
    let _medicalAidUid;
    if (existingMedicalAid.length > 0) {
      // Update existing record
      const existing = existingMedicalAid[0];
      if (!existing) {
        throw new Error('Existing medical aid record is undefined');
      }

      await logger.debug(
        'api/files/[uid]/db_write.ts',
        `Updating existing medical aid with UID: ${existing.uid}`
      );

      await db
        .update(patientMedicalAid)
        .set({
          medicalSchemeId: schemeId,
          membershipNumber: membershipNumber,
          patientDependantCode: dependentCode,
          lastEdit: new Date().toISOString(),
        })
        .where(eq(patientMedicalAid.uid, existing.uid));

      _medicalAidUid = existing.uid;
    } else {
      // Create new record
      _medicalAidUid = uuidv4();
      await logger.info(
        'api/files/[uid]/db_write.ts',
        `Creating new medical aid with UID: ${_medicalAidUid}`
      );

      await db.insert(patientMedicalAid).values({
        uid: _medicalAidUid,
        medicalSchemeId: schemeId,
        membershipNumber: membershipNumber,
        patientDependantCode: dependentCode,
        fileid: fileUid,
        orgid: orgId,
        active: true,
        dateCreated: new Date().toISOString(),
        lastEdit: new Date().toISOString(),
      });
    }

    await logger.info(
      'api/files/[uid]/db_write.ts',
      'Medical aid processing completed'
    );

    // Process medical aid member if provided
    if (medicalCover.member && _medicalAidUid) {
      await processMedicalAidMember(
        fileUid,
        _medicalAidUid,
        medicalCover.member,
        orgId
      );
    }
  } catch (error) {
    await logger.error(
      'api/files/[uid]/db_write.ts',
      `Error processing medical aid: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    throw error;
  }
}

// Helper function to process medical aid member data
async function processMedicalAidMember(
  fileUid: string,
  medicalAidUid: string,
  memberData: MemberData,
  orgId: string
): Promise<void> {
  const logger = Logger.getInstance();
  await logger.init();

  try {
    await logger.debug(
      'api/files/[uid]/db_write.ts',
      `Processing medical aid member data: ${JSON.stringify(memberData, null, 2)}`
    );
    await logger.debug(
      'api/files/[uid]/db_write.ts',
      'Processing medical aid member data'
    );

    // Find existing member record
    const existingMember = await db
      .select({
        link: patientmedicalaidFilePatient,
        patient: patient,
      })
      .from(patientmedicalaidFilePatient)
      .leftJoin(
        patient,
        eq(patientmedicalaidFilePatient.patientid, patient.uid)
      )
      .where(
        and(
          eq(patientmedicalaidFilePatient.fileid, fileUid),
          eq(patientmedicalaidFilePatient.patientMedicalAidId, medicalAidUid),
          eq(patientmedicalaidFilePatient.active, true)
        )
      )
      .limit(1);

    const existingRecord = existingMember[0];

    // Parse member date of birth if provided (avoid timezone conversion)
    let memberDobDate: string | null = null;
    if (memberData.dob) {
      const dobParts = memberData.dob.split('/');
      if (dobParts.length === 3) {
        const year = String(dobParts[0] || '').padStart(4, '0');
        const month = String(dobParts[1] || '').padStart(2, '0');
        const day = String(dobParts[2] || '').padStart(2, '0');
        memberDobDate = `${year}-${month}-${day}`;
      }
    }

    if (existingRecord && existingRecord.patient) {
      // Update existing member patient
      const memberPatientUid = existingRecord.patient.uid;
      await logger.debug(
        'api/files/[uid]/db_write.ts',
        `Updating existing member with UID: ${memberPatientUid}`
      );

      await db
        .update(patient)
        .set({
          id: memberData.id || '',
          title: memberData.title || '',
          name: memberData.name || '',
          initials: memberData.initials || '',
          surname: memberData.surname || '',
          dateOfBirth: memberDobDate,
          gender: memberData.gender || '',
          cellPhone: memberData.cell || '',
          email: memberData.email || '',
          address: memberData.address || '',
          lastEdit: new Date().toISOString(),
        })
        .where(eq(patient.uid, memberPatientUid));
    } else if (memberData.name || memberData.surname) {
      // Create new member patient
      const memberPatientUid = uuidv4();
      await logger.info(
        'api/files/[uid]/db_write.ts',
        `Creating new member patient with UID: ${memberPatientUid}`
      );

      await db.insert(patient).values({
        uid: memberPatientUid,
        id: memberData.id || '',
        title: memberData.title || '',
        name: memberData.name || '',
        initials: memberData.initials || '',
        surname: memberData.surname || '',
        dateOfBirth: memberDobDate,
        gender: memberData.gender || '',
        cellPhone: memberData.cell || '',
        email: memberData.email || '',
        address: memberData.address || '',
        orgid: orgId,
        active: true,
        dateCreated: new Date().toISOString(),
        lastEdit: new Date().toISOString(),
      });

      // Create the link between medical aid and member patient
      const linkUid = uuidv4();
      await logger.info(
        'api/files/[uid]/db_write.ts',
        `Creating new medical aid member link with UID: ${linkUid}`
      );

      await db.insert(patientmedicalaidFilePatient).values({
        uid: linkUid,
        patientMedicalAidId: medicalAidUid,
        fileid: fileUid,
        patientid: memberPatientUid,
        orgid: orgId,
        active: true,
        dateCreated: new Date().toISOString(),
        lastEdit: new Date().toISOString(),
      });
    }

    await logger.info(
      'api/files/[uid]/db_write.ts',
      'Medical aid member processing completed'
    );
  } catch (error) {
    await logger.error(
      'api/files/[uid]/db_write.ts',
      `Error processing medical aid member: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    throw error;
  }
}

// Helper function to process injury on duty data
async function processInjuryOnDuty(
  fileUid: string,
  data: InjuryOnDutyData,
  orgId: string
): Promise<void> {
  const logger = Logger.getInstance();
  await logger.init();

  try {
    await logger.debug(
      'api/files/[uid]/db_write.ts',
      `Processing injury on duty data: ${JSON.stringify(data, null, 2)}`
    );
    await logger.debug(
      'api/files/[uid]/db_write.ts',
      'Processing injury on duty data'
    );

    // Find existing injury on duty record
    const existingInjury = await db
      .select()
      .from(injuryOnDuty)
      .where(
        and(eq(injuryOnDuty.fileid, fileUid), eq(injuryOnDuty.active, true))
      )
      .limit(1);

    if (existingInjury.length > 0) {
      // Update existing record
      const existing = existingInjury[0];
      if (!existing) {
        throw new Error('Existing injury record is undefined');
      }
      await logger.debug(
        'api/files/[uid]/db_write.ts',
        `Updating existing injury record with UID: ${existing.uid}`
      );

      await db
        .update(injuryOnDuty)
        .set({
          companyName: data.company_name || '',
          contactPerson: data.contact_person || '',
          contactNumber: data.contact_number || '',
          contactEmail: data.contact_email || '',
          lastEdit: new Date().toISOString(),
        })
        .where(eq(injuryOnDuty.uid, existing.uid));
    } else {
      // Create new record
      const injuryUid = uuidv4();
      await logger.info(
        'api/files/[uid]/db_write.ts',
        `Creating new injury record with UID: ${injuryUid}`
      );

      await db.insert(injuryOnDuty).values({
        uid: injuryUid,
        companyName: data.company_name || '',
        contactPerson: data.contact_person || '',
        contactNumber: data.contact_number || '',
        contactEmail: data.contact_email || '',
        fileid: fileUid,
        orgid: orgId,
        active: true,
        dateCreated: new Date().toISOString(),
        lastEdit: new Date().toISOString(),
      });
    }

    await logger.info(
      'api/files/[uid]/db_write.ts',
      'Injury on duty processing completed'
    );
  } catch (error) {
    await logger.error(
      'api/files/[uid]/db_write.ts',
      `Error processing injury on duty: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    throw error;
  }
}
