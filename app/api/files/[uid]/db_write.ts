import db, {
  fileInfo,
  fileinfoPatient,
  patient,
  patientMedicalAid,
  injuryOnDuty,
  patientmedicalaidFilePatient,
} from '@/app/lib/drizzle';
import { and, eq } from 'drizzle-orm';
import { Logger } from '@/app/lib/logger';
import { v4 as uuidv4 } from 'uuid';

// Handle PUT requests to update an existing file
export async function handleUpdateFile(
  uid: string,
  data: any,
  orgId: string
): Promise<{ data?: any; error?: string; status: number }> {
  const logger = Logger.getInstance();
  await logger.init();

  try {
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
    let upsertedFileInfo;
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
      upsertedFileInfo = updated[0];
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
      upsertedFileInfo = created[0];
    }

    if (!upsertedFileInfo) {
      throw new Error('Failed to upsert file info');
    }

    await logger.info(
      'api/files/[uid]/db_write.ts',
      `File_info upserted with UID: ${upsertedFileInfo.uid}`
    );

    // Process patient information if provided
    if (data.patient) {
      await logger.debug(
        'api/files/[uid]/db_write.ts',
        'Processing patient data'
      );

      // Parse date of birth if provided
      let dobDate: string | null = null;
      if (data.patient.dob) {
        const dobParts = data.patient.dob.split('/');
        if (dobParts.length === 3) {
          const year = parseInt(dobParts[0]);
          const month = parseInt(dobParts[1]) - 1; // Month (0-indexed)
          const day = parseInt(dobParts[2]);
          const dateObj = new Date(year, month, day);
          const isoString = dateObj.toISOString();
          dobDate = isoString.split('T')[0] || null; // Convert to YYYY-MM-DD format
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
        // Update existing patient
        await logger.debug(
          'api/files/[uid]/db_write.ts',
          `Updating existing patient with UID: ${existingPatient.uid}`
        );

        await db
          .update(patient)
          .set({
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
          .where(eq(patient.uid, existingPatient.uid));

        await logger.info(
          'api/files/[uid]/db_write.ts',
          'Existing patient updated'
        );
      } else if (data.patient.name || data.patient.surname) {
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
      } else if (data.medical_cover.type === 'injury-on-duty') {
        // Handle injury on duty type
        await processInjuryOnDuty(fileUid, data.medical_cover, orgId);
      }
      // For 'private' type, no additional records needed
    }

    // Fetch the updated file data to return
    const updatedFileData = await db
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

    const updatedRecord = updatedFileData[0];
    if (!updatedRecord) {
      await logger.error(
        'api/files/[uid]/db_write.ts',
        'Failed to fetch updated file data'
      );
      return { error: 'File not found after update', status: 404 };
    }

    // Get the associated patient data if available
    const filePatientData = updatedRecord.patient || null;

    // Format date of birth if it exists
    let formattedDob = '';
    if (filePatientData?.dateOfBirth) {
      const dob = new Date(filePatientData.dateOfBirth);
      formattedDob = `${dob.getFullYear()}/${String(dob.getMonth() + 1).padStart(2, '0')}/${String(dob.getDate()).padStart(2, '0')}`;
    }

    // Prepare the response data
    const responseData = {
      uid: updatedRecord.fileInfo.uid,
      file_number: updatedRecord.fileInfo.fileNumber || '',
      account_number: updatedRecord.fileInfo.accountNumber || '',
      referral_doc_name: updatedRecord.fileInfo.referralDocName || '',
      referral_doc_number: updatedRecord.fileInfo.referralDocNumber || '',
      patient: filePatientData
        ? {
            id: filePatientData.id || '',
            title: filePatientData.title || '',
            name: filePatientData.name || '',
            initials: filePatientData.initials || '',
            surname: filePatientData.surname || '',
            dob: formattedDob,
            gender: filePatientData.gender || '',
            cell_phone: filePatientData.cellPhone || '',
            additional_name: filePatientData.additionalName || '',
            additional_cell: filePatientData.additionalCell || '',
            email: filePatientData.email || '',
            address: filePatientData.address || '',
          }
        : {
            id: '',
            title: '',
            name: '',
            initials: '',
            surname: '',
            dob: '',
            gender: '',
            cell_phone: '',
            additional_name: '',
            additional_cell: '',
            email: '',
            address: '',
          },
      medical_cover: data.medical_cover || {
        type: 'medical-aid',
        same_as_patient: false,
        member: {
          id: '',
          name: '',
          initials: '',
          surname: '',
          dob: '',
          cell: '',
          email: '',
          address: '',
        },
        medical_aid: {
          name: '',
          membership_number: '',
          dependent_code: '',
        },
      },
    };

    await logger.info(
      'api/files/[uid]/db_write.ts',
      'File update completed successfully'
    );
    return { data: responseData, status: 200 };
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
  data: any,
  orgId: string
): Promise<{ data?: any; error?: string; status: number }> {
  const logger = Logger.getInstance();
  await logger.init();

  try {
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
    let patientData = null;

    if (data.patient && (data.patient.name || data.patient.surname)) {
      await logger.debug(
        'api/files/[uid]/db_write.ts',
        'Processing patient data for new file'
      );

      // Validation for patient ID
      if (!data.patient.id) {
        return {
          error: 'Patient ID number is required to create a new file.',
          status: 400,
        };
      }

      // Parse date of birth if provided
      let dobDate: string | null = null;
      if (data.patient.dob) {
        const dobParts = data.patient.dob.split('/');
        if (dobParts.length === 3) {
          const year = parseInt(dobParts[0]);
          const month = parseInt(dobParts[1]) - 1; // Month (0-indexed)
          const day = parseInt(dobParts[2]);
          const dateObj = new Date(year, month, day);
          const isoString = dateObj.toISOString();
          dobDate = isoString.split('T')[0] || null; // Convert to YYYY-MM-DD format
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
        })
        .returning();

      const newPatientRecord = newPatient[0];
      if (!newPatientRecord) {
        throw new Error('Failed to create patient');
      }

      await logger.info(
        'api/files/[uid]/db_write.ts',
        `Patient created with UID: ${newPatientRecord.uid}`
      );

      // Generate a new UUID for the relationship
      const relationshipUid = uuidv4();

      // Create the fileinfo_patient relationship
      await db.insert(fileinfoPatient).values({
        uid: relationshipUid,
        fileid: newFileUid,
        patientid: newPatientUid,
        orgid: orgId,
        active: true,
        dateCreated: new Date().toISOString(),
        lastEdit: new Date().toISOString(),
      });

      await logger.info(
        'api/files/[uid]/db_write.ts',
        `fileinfo_patient relationship created with UID: ${relationshipUid}`
      );

      // Store the patient data for the response
      patientData = {
        id: data.patient.id || '',
        title: data.patient.title || '',
        name: data.patient.name || '',
        initials: data.patient.initials || '',
        surname: data.patient.surname || '',
        dob: data.patient.dob || '',
        gender: data.patient.gender || '',
        cell_phone: data.patient.cell_phone || '',
        additional_name: data.patient.additional_name || '',
        additional_cell: data.patient.additional_cell || '',
        email: data.patient.email || '',
        address: data.patient.address || '',
      };
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
      } else if (data.medical_cover.type === 'injury-on-duty') {
        // Handle injury on duty type
        await processInjuryOnDuty(newFileUid, data.medical_cover, orgId);
      }
      // For 'private' type, no additional records needed
    }

    // Prepare the response data
    const responseData = {
      uid: newFileUid,
      file_number: data.file_number || '',
      account_number: data.account_number || '',
      referral_doc_name: data.referral_doc_name || '',
      referral_doc_number: data.referral_doc_number || '',
      patient: patientData || {
        id: '',
        title: '',
        name: '',
        initials: '',
        surname: '',
        dob: '',
        gender: '',
        cell_phone: '',
        additional_name: '',
        additional_cell: '',
        email: '',
        address: '',
      },
      medical_cover: data.medical_cover || {
        type: 'medical-aid',
        same_as_patient: false,
        member: {
          id: '',
          name: '',
          initials: '',
          surname: '',
          dob: '',
          cell: '',
          email: '',
          address: '',
        },
        medical_aid: {
          name: '',
          membership_number: '',
          dependent_code: '',
        },
      },
    };

    await logger.info(
      'api/files/[uid]/db_write.ts',
      'New file created successfully'
    );
    return { data: responseData, status: 200 };
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
  medicalCover: any,
  orgId: string
): Promise<void> {
  const logger = Logger.getInstance();
  await logger.init();

  try {
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
    let medicalAidUid;
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

      medicalAidUid = existing.uid;
    } else {
      // Create new record
      medicalAidUid = uuidv4();
      await logger.info(
        'api/files/[uid]/db_write.ts',
        `Creating new medical aid with UID: ${medicalAidUid}`
      );

      await db.insert(patientMedicalAid).values({
        uid: medicalAidUid,
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
    if (medicalCover.member && medicalAidUid) {
      await processMedicalAidMember(
        fileUid,
        medicalAidUid,
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
  memberData: any,
  orgId: string
): Promise<void> {
  const logger = Logger.getInstance();
  await logger.init();

  try {
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

    // Parse member date of birth if provided
    let memberDobDate: string | null = null;
    if (memberData.dob) {
      const dobParts = memberData.dob.split('/');
      if (dobParts.length === 3) {
        const year = parseInt(dobParts[0]);
        const month = parseInt(dobParts[1]) - 1; // Month (0-indexed)
        const day = parseInt(dobParts[2]);
        const dateObj = new Date(year, month, day);
        const isoString = dateObj.toISOString();
        memberDobDate = isoString.split('T')[0] || null; // Convert to YYYY-MM-DD format
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
  data: any,
  orgId: string
): Promise<void> {
  const logger = Logger.getInstance();
  await logger.init();

  try {
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
          companyName: data.injury_on_duty?.company_name || '',
          contactPerson: data.injury_on_duty?.contact_person || '',
          contactNumber: data.injury_on_duty?.contact_number || '',
          contactEmail: data.injury_on_duty?.contact_email || '',
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
        companyName: data.injury_on_duty?.company_name || '',
        contactPerson: data.injury_on_duty?.contact_person || '',
        contactNumber: data.injury_on_duty?.contact_number || '',
        contactEmail: data.injury_on_duty?.contact_email || '',
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
