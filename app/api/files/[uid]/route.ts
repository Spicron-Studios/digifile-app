import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { auth } from '@/app/lib/auth';
import chalk from 'chalk';
import { v4 as uuidv4 } from 'uuid';

// GET a single file by uid
export async function GET(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    console.log(chalk.blue.bold(`🔍 API: /api/files/${params.uid} GET called`));
    const session = await auth();
    if (!session?.user?.orgId) {
      console.log(chalk.red('❌ API: No organization ID found in session'));
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For new files or if no uid is provided, return a template
    if (!params.uid || params.uid === 'new') {
      console.log(chalk.yellow('📄 API: New file template requested'));
      return NextResponse.json({
        uid: '',
        file_number: '',
        account_number: '',
        patient: {
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
        medical_cover: {
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
      });
    }

    console.log(chalk.cyan(`🏢 API: Fetching file with UID: ${params.uid}`));

    // Find the file info record
    const fileInfo = await prisma.file_info.findFirst({
      where: {
        uid: params.uid,
        active: true,
        orgid: session.user.orgId
      },
      include: {
        fileinfo_patient: {
          where: {
            active: true
          },
          include: {
            patient: {
              where: {
                active: true
              }
            }
          }
        },
        patient_medical_aid: {
          where: {
            active: true
          },
          include: {
            medical_scheme: true
          }
        }
      },
    });

    if (!fileInfo) {
      console.log(chalk.yellow(`📭 API: File with UID ${params.uid} not found`));
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Get the first linked patient if it exists
    const filePatient = fileInfo.fileinfo_patient.length > 0 
      ? fileInfo.fileinfo_patient[0] 
      : null;
    const patient = filePatient?.patient || null;
    
    // Get medical aid info if it exists
    const medicalAid = fileInfo.patient_medical_aid.length > 0
      ? fileInfo.patient_medical_aid[0]
      : null;

    // Format date of birth in YYYY/MM/DD format if it exists
    let formattedDob = '';
    if (patient?.date_of_birth) {
      const dob = new Date(patient.date_of_birth);
      formattedDob = `${dob.getFullYear()}/${String(dob.getMonth() + 1).padStart(2, '0')}/${String(dob.getDate()).padStart(2, '0')}`;
    }

    // Return the file data with expanded patient fields
    const fileData = {
      uid: fileInfo.uid,
      file_number: fileInfo.file_number || '',
      account_number: fileInfo.account_number || '',
      patient: {
        id: patient?.id || '',
        title: patient?.title || '',
        name: patient?.name || '',
        initials: patient?.initials || '',
        surname: patient?.surname || '',
        dob: formattedDob,
        gender: patient?.gender || '',
        cell_phone: patient?.cell_phone || '',
        additional_name: patient?.additional_name || '',
        additional_cell: patient?.additional_cell || '',
        email: patient?.email || '',
        address: patient?.address || ''
      },
      medical_cover: {
        type: medicalAid ? 'medical-aid' : 'private',
        same_as_patient: false, // This would need to be determined by a separate field
        member: {
          // This would need to be linked to the responsible person
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
          name: medicalAid?.medical_scheme?.scheme_name || '',
          membership_number: medicalAid?.membership_number || '',
          dependent_code: medicalAid?.patient_dependant_code || ''
        }
      }
    };

    console.log(chalk.green('✅ API: File data retrieved successfully'));
    return NextResponse.json(fileData);
  } catch (error) {
    console.error(chalk.red('💥 API: Error fetching file:'), error);
    return NextResponse.json({ error: 'Failed to fetch file' }, { status: 500 });
  }
}

// PUT endpoint for updating an existing file
export async function PUT(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    console.log(chalk.blue.bold(`🔍 API: /api/files/${params.uid} PUT called`));
    const session = await auth();
    if (!session?.user?.orgId) {
      console.log(chalk.red('❌ API: No organization ID found in session'));
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    // Log the full received data object for debugging
    console.log(chalk.yellow('📦 API: RECEIVED DATA OBJECT:'));
    console.log(JSON.stringify(data, null, 2));

    // The uid from params is our identifier for file_info
    const fileUid = params.uid;
    
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
        orgid: session.user.orgId,
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
            orgid: session.user.orgId,
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
            orgid: session.user.orgId,
            active: true,
            date_created: new Date(),
            last_edit: new Date()
          }
        });
        
        console.log(chalk.green('✅ API: New patient and relationship created successfully'));
      }
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
      return NextResponse.json({ error: 'File not found after update' }, { status: 404 });
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
    return NextResponse.json(responseData);
  } catch (error) {
    console.error(chalk.red('💥 API: Error updating file:'), error);
    return NextResponse.json({ error: 'Failed to update file' }, { status: 500 });
  }
}

// POST endpoint for creating a new file
export async function POST(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    console.log(chalk.blue.bold(`🔍 API: /api/files/new POST called`));
    const session = await auth();
    if (!session?.user?.orgId) {
      console.log(chalk.red('❌ API: No organization ID found in session'));
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json();
    
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
        orgid: session.user.orgId,
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
          orgid: session.user.orgId,
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
          orgid: session.user.orgId,
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
    return NextResponse.json(responseData);
  } catch (error) {
    console.error(chalk.red('💥 API: Error creating new file:'), error);
    return NextResponse.json({ error: 'Failed to create new file' }, { status: 500 });
  }
}
