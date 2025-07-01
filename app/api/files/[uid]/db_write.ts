import prisma from '@/app/lib/prisma';
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
    const existingFileInfo = await prisma.file_info.findUnique({
      where: { uid: fileUid },
      include: {
        fileinfo_patient: {
          where: { active: true },
          include: {
            patient: true,
          },
        },
      },
    });

    await logger.debug(
      'api/files/[uid]/db_write.ts',
      `Existing file_info found: ${!!existingFileInfo}`
    );
    if (existingFileInfo) {
      await logger.debug(
        'api/files/[uid]/db_write.ts',
        `Has fileinfo_patient relationships: ${existingFileInfo.fileinfo_patient.length > 0}`
      );
    }

    // Upsert the file_info record
    const upsertedFileInfo = await prisma.file_info.upsert({
      where: { uid: fileUid },
      update: {
        file_number: data.file_number,
        account_number: data.account_number,
        referral_doc_name: data.referral_doc_name,
        referral_doc_number: data.referral_doc_number,
        last_edit: new Date(),
      },
      create: {
        uid: fileUid,
        file_number: data.file_number || '',
        account_number: data.account_number || '',
        referral_doc_name: data.referral_doc_name || '',
        referral_doc_number: data.referral_doc_number || '',
        orgid: orgId,
        active: true,
        date_created: new Date(),
        last_edit: new Date(),
      },
    });

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
      let dobDate = null;
      if (data.patient.dob) {
        const dobParts = data.patient.dob.split('/');
        if (dobParts.length === 3) {
          dobDate = new Date(
            parseInt(dobParts[0]), // Year
            parseInt(dobParts[1]) - 1, // Month (0-indexed)
            parseInt(dobParts[2]) // Day
          );
        }
      }

      // Find existing fileinfo_patient relationship if any
      let existingRelation = null;
      let existingPatient = null;

      if (existingFileInfo && existingFileInfo.fileinfo_patient.length > 0) {
        existingRelation = existingFileInfo.fileinfo_patient[0];
        if (existingRelation) {
          existingPatient = existingRelation.patient;
          await logger.debug(
            'api/files/[uid]/db_write.ts',
            `Found existing patient relationship with UID: ${existingPatient?.uid}`
          );
        }
      }

      // Decide whether to update existing patient or create new one
      if (existingPatient) {
        // Update existing patient
        await logger.debug(
          'api/files/[uid]/db_write.ts',
          `Updating existing patient with UID: ${existingPatient.uid}`
        );

        await prisma.patient.update({
          where: { uid: existingPatient.uid },
          data: {
            title: data.patient.title,
            name: data.patient.name,
            initials: data.patient.initials,
            surname: data.patient.surname,
            date_of_birth: dobDate,
            gender: data.patient.gender,
            cell_phone: data.patient.cell_phone,
            additional_name: data.patient.additional_name,
            additional_cell: data.patient.additional_cell,
            email: data.patient.email,
            address: data.patient.address,
            last_edit: new Date(),
          },
        });

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
        await prisma.patient.create({
          data: {
            uid: newPatientUid,
            id: data.patient.id || '',
            title: data.patient.title || '',
            name: data.patient.name || '',
            initials: data.patient.initials || '',
            surname: data.patient.surname || '',
            date_of_birth: dobDate,
            gender: data.patient.gender || '',
            cell_phone: data.patient.cell_phone || '',
            additional_name: data.patient.additional_name || '',
            additional_cell: data.patient.additional_cell || '',
            email: data.patient.email || '',
            address: data.patient.address || '',
            orgid: orgId,
            active: true,
            date_created: new Date(),
            last_edit: new Date(),
          },
        });

        // Create the fileinfo_patient relationship
        const newRelationUid = uuidv4();
        await logger.info(
          'api/files/[uid]/db_write.ts',
          `Creating fileinfo_patient relationship with UID: ${newRelationUid}`
        );

        await prisma.fileinfo_patient.create({
          data: {
            uid: newRelationUid,
            fileid: fileUid,
            patientid: newPatientUid,
            orgid: orgId,
            active: true,
            date_created: new Date(),
            last_edit: new Date(),
          },
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
    const updatedFileData = await prisma.file_info.findUnique({
      where: { uid: fileUid },
      include: {
        fileinfo_patient: {
          where: { active: true },
          include: {
            patient: true,
          },
        },
      },
    });

    if (!updatedFileData) {
      await logger.error(
        'api/files/[uid]/db_write.ts',
        'Failed to fetch updated file data'
      );
      return { error: 'File not found after update', status: 404 };
    }

    // Get the associated patient data if available
    const filePatient = updatedFileData.fileinfo_patient[0]?.patient || null;

    // Format date of birth if it exists
    let formattedDob = '';
    if (filePatient?.date_of_birth) {
      const dob = new Date(filePatient.date_of_birth);
      formattedDob = `${dob.getFullYear()}/${String(dob.getMonth() + 1).padStart(2, '0')}/${String(dob.getDate()).padStart(2, '0')}`;
    }

    // Prepare the response data
    const responseData = {
      uid: updatedFileData.uid,
      file_number: updatedFileData.file_number || '',
      account_number: updatedFileData.account_number || '',
      referral_doc_name: updatedFileData.referral_doc_name || '',
      referral_doc_number: updatedFileData.referral_doc_number || '',
      patient: filePatient
        ? {
            id: filePatient.id || '',
            title: filePatient.title || '',
            name: filePatient.name || '',
            initials: filePatient.initials || '',
            surname: filePatient.surname || '',
            dob: formattedDob,
            gender: filePatient.gender || '',
            cell_phone: filePatient.cell_phone || '',
            additional_name: filePatient.additional_name || '',
            additional_cell: filePatient.additional_cell || '',
            email: filePatient.email || '',
            address: filePatient.address || '',
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
    const newFileInfo = await prisma.file_info.create({
      data: {
        uid: newFileUid,
        file_number: data.file_number || '',
        account_number: data.account_number || '',
        referral_doc_name: data.referral_doc_name || '',
        referral_doc_number: data.referral_doc_number || '',
        orgid: orgId,
        active: true,
        date_created: new Date(),
        last_edit: new Date(),
      },
    });

    await logger.info(
      'api/files/[uid]/db_write.ts',
      `New file_info created with UID: ${newFileInfo.uid}`
    );

    // Create patient record if patient data is provided
    let patientData = null;

    if (data.patient && (data.patient.name || data.patient.surname)) {
      await logger.debug(
        'api/files/[uid]/db_write.ts',
        'Processing patient data for new file'
      );

      // Parse date of birth if provided
      let dobDate = null;
      if (data.patient.dob) {
        const dobParts = data.patient.dob.split('/');
        if (dobParts.length === 3) {
          dobDate = new Date(
            parseInt(dobParts[0]), // Year
            parseInt(dobParts[1]) - 1, // Month (0-indexed)
            parseInt(dobParts[2]) // Day
          );
        }
      }

      // Generate a new UUID for the patient
      const newPatientUid = uuidv4();
      await logger.info(
        'api/files/[uid]/db_write.ts',
        `Creating new patient with UID: ${newPatientUid}`
      );

      // Create the patient record
      const newPatient = await prisma.patient.create({
        data: {
          uid: newPatientUid,
          id: data.patient.id || '',
          title: data.patient.title || '',
          name: data.patient.name || '',
          initials: data.patient.initials || '',
          surname: data.patient.surname || '',
          date_of_birth: dobDate,
          gender: data.patient.gender || '',
          cell_phone: data.patient.cell_phone || '',
          additional_name: data.patient.additional_name || '',
          additional_cell: data.patient.additional_cell || '',
          email: data.patient.email || '',
          address: data.patient.address || '',
          orgid: orgId,
          active: true,
          date_created: new Date(),
          last_edit: new Date(),
        },
      });

      await logger.info(
        'api/files/[uid]/db_write.ts',
        `Patient created with UID: ${newPatient.uid}`
      );

      // Generate a new UUID for the relationship
      const relationshipUid = uuidv4();

      // Create the fileinfo_patient relationship
      await prisma.fileinfo_patient.create({
        data: {
          uid: relationshipUid,
          fileid: newFileUid,
          patientid: newPatientUid,
          orgid: orgId,
          active: true,
          date_created: new Date(),
          last_edit: new Date(),
        },
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
    const existingMedicalAid = await prisma.patient_medical_aid.findFirst({
      where: {
        fileid: fileUid,
        active: true,
      },
    });

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
    if (existingMedicalAid) {
      // Update existing record
      await logger.debug(
        'api/files/[uid]/db_write.ts',
        `Updating existing medical aid with UID: ${existingMedicalAid.uid}`
      );

      await prisma.patient_medical_aid.update({
        where: { uid: existingMedicalAid.uid },
        data: {
          medical_scheme_id: schemeId,
          membership_number: membershipNumber,
          patient_dependant_code: dependentCode,
          last_edit: new Date(),
        },
      });

      medicalAidUid = existingMedicalAid.uid;
    } else {
      // Create new record
      medicalAidUid = uuidv4();
      await logger.info(
        'api/files/[uid]/db_write.ts',
        `Creating new medical aid with UID: ${medicalAidUid}`
      );

      await prisma.patient_medical_aid.create({
        data: {
          uid: medicalAidUid,
          medical_scheme_id: schemeId,
          membership_number: membershipNumber,
          patient_dependant_code: dependentCode,
          fileid: fileUid,
          orgid: orgId,
          active: true,
          date_created: new Date(),
          last_edit: new Date(),
        },
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
    const existingMember =
      await prisma.patientmedicalaid_file_patient.findFirst({
        where: {
          fileid: fileUid,
          patient_medical_aid_id: medicalAidUid,
          active: true,
        },
        include: {
          patient: true,
        },
      });

    // Parse member date of birth if provided
    let memberDobDate = null;
    if (memberData.dob) {
      const dobParts = memberData.dob.split('/');
      if (dobParts.length === 3) {
        memberDobDate = new Date(
          parseInt(dobParts[0]), // Year
          parseInt(dobParts[1]) - 1, // Month (0-indexed)
          parseInt(dobParts[2]) // Day
        );
      }
    }

    if (existingMember && existingMember.patient) {
      // Update existing member patient
      const memberPatientUid = existingMember.patient.uid;
      await logger.debug(
        'api/files/[uid]/db_write.ts',
        `Updating existing member with UID: ${memberPatientUid}`
      );

      await prisma.patient.update({
        where: { uid: memberPatientUid },
        data: {
          id: memberData.id || '',
          title: memberData.title || '',
          name: memberData.name || '',
          initials: memberData.initials || '',
          surname: memberData.surname || '',
          date_of_birth: memberDobDate,
          gender: memberData.gender || '',
          cell_phone: memberData.cell || '',
          email: memberData.email || '',
          address: memberData.address || '',
          last_edit: new Date(),
        },
      });
    } else if (memberData.name || memberData.surname) {
      // Create new member patient
      const memberPatientUid = uuidv4();
      await logger.info(
        'api/files/[uid]/db_write.ts',
        `Creating new member patient with UID: ${memberPatientUid}`
      );

      await prisma.patient.create({
        data: {
          uid: memberPatientUid,
          id: memberData.id || '',
          title: memberData.title || '',
          name: memberData.name || '',
          initials: memberData.initials || '',
          surname: memberData.surname || '',
          date_of_birth: memberDobDate,
          gender: memberData.gender || '',
          cell_phone: memberData.cell || '',
          email: memberData.email || '',
          address: memberData.address || '',
          orgid: orgId,
          active: true,
          date_created: new Date(),
          last_edit: new Date(),
        },
      });

      // Create the link between medical aid and member patient
      const linkUid = uuidv4();
      await logger.info(
        'api/files/[uid]/db_write.ts',
        `Creating new medical aid member link with UID: ${linkUid}`
      );

      await prisma.patientmedicalaid_file_patient.create({
        data: {
          uid: linkUid,
          patient_medical_aid_id: medicalAidUid,
          fileid: fileUid,
          patientid: memberPatientUid,
          orgid: orgId,
          active: true,
          date_created: new Date(),
          last_edit: new Date(),
        },
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
    const existingInjury = await prisma.injury_on_duty.findFirst({
      where: {
        fileid: fileUid,
        active: true,
      },
    });

    if (existingInjury) {
      // Update existing record
      await logger.debug(
        'api/files/[uid]/db_write.ts',
        `Updating existing injury record with UID: ${existingInjury.uid}`
      );

      await prisma.injury_on_duty.update({
        where: { uid: existingInjury.uid },
        data: {
          company_name: data.injury_on_duty?.company_name || '',
          contact_person: data.injury_on_duty?.contact_person || '',
          contact_number: data.injury_on_duty?.contact_number || '',
          contact_email: data.injury_on_duty?.contact_email || '',
          last_edit: new Date(),
        },
      });
    } else {
      // Create new record
      const injuryUid = uuidv4();
      await logger.info(
        'api/files/[uid]/db_write.ts',
        `Creating new injury record with UID: ${injuryUid}`
      );

      await prisma.injury_on_duty.create({
        data: {
          uid: injuryUid,
          company_name: data.injury_on_duty?.company_name || '',
          contact_person: data.injury_on_duty?.contact_person || '',
          contact_number: data.injury_on_duty?.contact_number || '',
          contact_email: data.injury_on_duty?.contact_email || '',
          fileid: fileUid,
          orgid: orgId,
          active: true,
          date_created: new Date(),
          last_edit: new Date(),
        },
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
