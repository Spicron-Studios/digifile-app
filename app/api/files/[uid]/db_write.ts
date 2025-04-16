import prisma from '@/app/lib/prisma';
import chalk from 'chalk';
import { v4 as uuidv4 } from 'uuid';

// Handle PUT requests to update an existing file
export async function handleUpdateFile(uid: string, data: any, orgId: string) {
  try {
    console.log(chalk.blue.bold(`🔍 API: Updating file with UID: ${uid}`));
    
    // Log the full received data object for debugging
    console.log(chalk.yellow('📦 API: RECEIVED DATA OBJECT:'));
    console.log(JSON.stringify(data, null, 2));

    // The uid from params is our identifier for file_info
    const fileUid = uid;
    
    // First, check if the file_info record exists
    const existingFileInfo = await prisma.file_info.findUnique({
      where: { uid: fileUid },
      include: {
        fileinfo_patient: {
          where: { active: true },
          include: {
            patient: true
          }
        }
      }
    });
    
    console.log(chalk.cyan(`🔍 API: Existing file_info found: ${!!existingFileInfo}`));
    if (existingFileInfo) {
      console.log(chalk.cyan(`🔍 API: Has fileinfo_patient relationships: ${existingFileInfo.fileinfo_patient.length > 0}`));
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
        last_edit: new Date()
      }
    });
    
    console.log(chalk.green(`✅ API: File_info upserted with UID: ${upsertedFileInfo.uid}`));
    
    // Process patient information if provided
    if (data.patient) {
      console.log(chalk.cyan('🧑 API: Processing patient data'));
      
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
        existingPatient = existingRelation.patient;
        console.log(chalk.yellow(`🔄 API: Found existing patient relationship with UID: ${existingPatient.uid}`));
      }
      
      // Decide whether to update existing patient or create new one
      if (existingPatient) {
        // Update existing patient
        console.log(chalk.yellow(`🔄 API: Updating existing patient with UID: ${existingPatient.uid}`));
        
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
            last_edit: new Date()
          }
        });
        
        console.log(chalk.green('✅ API: Existing patient updated'));
      } else if (data.patient.name || data.patient.surname) {
        // Create new patient and relationship
        const newPatientUid = uuidv4();
        console.log(chalk.green(`➕ API: Creating new patient with UID: ${newPatientUid}`));
        
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
            last_edit: new Date()
          }
        });
        
        // Create the fileinfo_patient relationship
        const newRelationUid = uuidv4();
        console.log(chalk.green(`➕ API: Creating fileinfo_patient relationship with UID: ${newRelationUid}`));
        
        await prisma.fileinfo_patient.create({
          data: {
            uid: newRelationUid,
            fileid: fileUid,
            patientid: newPatientUid,
            orgid: orgId,
            active: true,
            date_created: new Date(),
            last_edit: new Date()
          }
        });
        
        console.log(chalk.green('✅ API: New patient and relationship created successfully'));
      }
    }
    
    // Process medical cover information
    if (data.medical_cover) {
      console.log(chalk.cyan('💊 API: Processing medical cover data'));
      
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
            patient: true
          }
        }
      }
    });
    
    if (!updatedFileData) {
      console.log(chalk.red('❌ API: Failed to fetch updated file data'));
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
      patient: filePatient ? {
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
        address: filePatient.address || ''
      } : {
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
        address: ''
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
          address: ''
        },
        medical_aid: {
          name: '',
          membership_number: '',
          dependent_code: ''
        }
      }
    };
    
    console.log(chalk.green('✅ API: File update completed successfully'));
    return { data: responseData, status: 200 };
  } catch (error) {
    console.error(chalk.red('💥 API: Error updating file:'), error);
    return { error: 'Failed to update file', status: 500 };
  }
}

// Handle POST requests to create a new file
export async function handleCreateFile(data: any, orgId: string) {
  try {
    console.log(chalk.blue.bold(`🔍 API: Creating new file`));
    
    // Log the full received data object for debugging
    console.log(chalk.yellow('📦 API: RECEIVED DATA OBJECT FOR NEW FILE:'));
    console.log(JSON.stringify(data, null, 2));
    
    // Generate a new UUID for this file
    const newFileUid = uuidv4();
    console.log(chalk.green(`🆕 API: Generated new file UID: ${newFileUid}`));
    
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
        last_edit: new Date()
      }
    });
    
    console.log(chalk.green(`✅ API: New file_info created with UID: ${newFileInfo.uid}`));
    
    // Create patient record if patient data is provided
    let patientData = null;
    
    if (data.patient && (data.patient.name || data.patient.surname)) {
      console.log(chalk.cyan('🧑 API: Processing patient data for new file'));
      
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
      console.log(chalk.green(`➕ API: Creating new patient with UID: ${newPatientUid}`));
      
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
          last_edit: new Date()
        }
      });
      
      console.log(chalk.green(`✅ API: Patient created with UID: ${newPatient.uid}`));
      
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
          last_edit: new Date()
        }
      });
      
      console.log(chalk.green(`✅ API: fileinfo_patient relationship created with UID: ${relationshipUid}`));
      
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
        address: data.patient.address || ''
      };
    }
    
    // Process medical cover information
    if (data.medical_cover) {
      console.log(chalk.cyan('💊 API: Processing medical cover data for new file'));
      
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
        address: ''
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
          address: ''
        },
        medical_aid: {
          name: '',
          membership_number: '',
          dependent_code: ''
        }
      }
    };
    
    console.log(chalk.green('✅ API: New file created successfully'));
    return { data: responseData, status: 200 };
  } catch (error) {
    console.error(chalk.red('💥 API: Error creating new file:'), error);
    return { error: 'Failed to create new file', status: 500 };
  }
}

// Helper function to process medical aid data
async function processMedicalAid(fileUid: string, medicalCover: any, orgId: string) {
  try {
    console.log(chalk.cyan('🏥 API: Processing medical aid data'));
    
    // Find existing medical aid record for this file if any
    const existingMedicalAid = await prisma.patient_medical_aid.findFirst({
      where: {
        fileid: fileUid,
        active: true
      }
    });
    
    // Extract medical aid data
    const medicalAidData = medicalCover.medical_aid || {};
    const schemeId = medicalAidData.scheme_id;
    const membershipNumber = medicalAidData.membership_number || '';
    const dependentCode = medicalAidData.dependent_code || '';
    
    // If scheme ID is not provided, we can't proceed with creating/updating medical aid
    if (!schemeId) {
      console.log(chalk.yellow('⚠️ API: No scheme ID provided, skipping medical aid save'));
      return;
    }
    
    // Upsert medical aid record
    let medicalAidUid;
    if (existingMedicalAid) {
      // Update existing record
      console.log(chalk.yellow(`🔄 API: Updating existing medical aid with UID: ${existingMedicalAid.uid}`));
      
      await prisma.patient_medical_aid.update({
        where: { uid: existingMedicalAid.uid },
        data: {
          medical_scheme_id: schemeId,
          membership_number: membershipNumber,
          patient_dependant_code: dependentCode,
          last_edit: new Date()
        }
      });
      
      medicalAidUid = existingMedicalAid.uid;
    } else {
      // Create new record
      medicalAidUid = uuidv4();
      console.log(chalk.green(`➕ API: Creating new medical aid with UID: ${medicalAidUid}`));
      
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
          last_edit: new Date()
        }
      });
    }
    
    // Handle the main member data (if "same as patient" is not checked)
    if (!medicalCover.same_as_patient && medicalCover.member) {
      await processMedicalAidMember(fileUid, medicalAidUid, medicalCover.member, orgId);
    }
    
    console.log(chalk.green('✅ API: Medical aid processing completed'));
  } catch (error) {
    console.error(chalk.red('💥 API: Error processing medical aid:'), error);
    throw error; // Re-throw to be caught by the caller
  }
}

// Helper function to process medical aid member data
async function processMedicalAidMember(fileUid: string, medicalAidUid: string, memberData: any, orgId: string) {
  try {
    console.log(chalk.cyan('👪 API: Processing medical aid member data'));
    
    // Find existing member link for this medical aid if any
    const existingLink = await prisma.patientmedicalaid_file_patient.findFirst({
      where: {
        patient_medical_aid_id: medicalAidUid,
        active: true
      },
      include: {
        patient: true
      }
    });
    
    // Parse date of birth if provided
    let dobDate = null;
    if (memberData.dob) {
      const dobParts = memberData.dob.split('/');
      if (dobParts.length === 3) {
        dobDate = new Date(
          parseInt(dobParts[0]), // Year
          parseInt(dobParts[1]) - 1, // Month (0-indexed)
          parseInt(dobParts[2]) // Day
        );
      }
    }
    
    let memberPatientUid;
    
    if (existingLink && existingLink.patient) {
      // Update existing patient record
      memberPatientUid = existingLink.patient.uid;
      console.log(chalk.yellow(`🔄 API: Updating existing member with UID: ${memberPatientUid}`));
      
      await prisma.patient.update({
        where: { uid: memberPatientUid },
        data: {
          id: memberData.id || '',
          title: memberData.title || '',
          name: memberData.name || '',
          initials: memberData.initials || '',
          surname: memberData.surname || '',
          date_of_birth: dobDate,
          gender: memberData.gender || '',
          cell_phone: memberData.cell || '',
          email: memberData.email || '',
          address: memberData.address || '',
          last_edit: new Date()
        }
      });
    } else {
      // Create new patient record for the member
      memberPatientUid = uuidv4();
      console.log(chalk.green(`➕ API: Creating new member patient with UID: ${memberPatientUid}`));
      
      await prisma.patient.create({
        data: {
          uid: memberPatientUid,
          id: memberData.id || '',
          title: memberData.title || '',
          name: memberData.name || '',
          initials: memberData.initials || '',
          surname: memberData.surname || '',
          date_of_birth: dobDate,
          gender: memberData.gender || '',
          cell_phone: memberData.cell || '',
          email: memberData.email || '',
          address: memberData.address || '',
          orgid: orgId,
          active: true,
          date_created: new Date(),
          last_edit: new Date()
        }
      });
      
      // Create new link record
      const linkUid = uuidv4();
      console.log(chalk.green(`➕ API: Creating new medical aid member link with UID: ${linkUid}`));
      
      await prisma.patientmedicalaid_file_patient.create({
        data: {
          uid: linkUid,
          patient_medical_aid_id: medicalAidUid,
          fileid: fileUid,
          patientid: memberPatientUid,
          orgid: orgId,
          active: true,
          date_created: new Date(),
          last_edit: new Date()
        }
      });
    }
    
    console.log(chalk.green('✅ API: Medical aid member processing completed'));
  } catch (error) {
    console.error(chalk.red('💥 API: Error processing medical aid member:'), error);
    throw error; // Re-throw to be caught by the caller
  }
}

// Helper function to process injury on duty data
async function processInjuryOnDuty(fileUid: string, data: any, orgId: string) {
  try {
    console.log(chalk.cyan('🏢 API: Processing injury on duty data'));
    
    // Find existing injury record for this file if any
    const existingInjury = await prisma.injury_on_duty.findFirst({
      where: {
        fileid: fileUid,
        active: true
      }
    });
    
    // Extract injury on duty data
    const injuryData = data.injury_on_duty || {};
    const companyName = injuryData.company_name || '';
    const contactPerson = injuryData.contact_person || '';
    const contactNumber = injuryData.contact_number || '';
    const contactEmail = injuryData.contact_email || '';
    
    if (existingInjury) {
      // Update existing record
      console.log(chalk.yellow(`🔄 API: Updating existing injury record with UID: ${existingInjury.uid}`));
      
      await prisma.injury_on_duty.update({
        where: { uid: existingInjury.uid },
        data: {
          company_name: companyName,
          contact_person: contactPerson,
          contact_number: contactNumber,
          contact_email: contactEmail,
          last_edit: new Date()
        }
      });
    } else {
      // Create new record
      const injuryUid = uuidv4();
      console.log(chalk.green(`➕ API: Creating new injury record with UID: ${injuryUid}`));
      
      await prisma.injury_on_duty.create({
        data: {
          uid: injuryUid,
          company_name: companyName,
          contact_person: contactPerson,
          contact_number: contactNumber,
          contact_email: contactEmail,
          fileid: fileUid,
          orgid: orgId,
          active: true,
          created_date: new Date(),
          date_created: new Date(),
          last_edit: new Date()
        }
      });
    }
    
    console.log(chalk.green('✅ API: Injury on duty processing completed'));
  } catch (error) {
    console.error(chalk.red('💥 API: Error processing injury on duty:'), error);
    throw error; // Re-throw to be caught by the caller
  }
}
