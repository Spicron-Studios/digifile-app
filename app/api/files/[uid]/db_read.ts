import prisma from '@/app/lib/prisma';
import chalk from 'chalk';
import { fetchMedicalSchemes } from './other_fn';

// Handle GET requests for file data
export async function handleGetFileData(uid: string, orgId: string) {
  try {
    console.log(chalk.blue.bold(`🔍 API: Getting file data for UID: ${uid}`));

    // Fetch medical schemes
    const medicalSchemes = await fetchMedicalSchemes(orgId);
    console.log(chalk.cyan(`🏥 API: Fetched ${medicalSchemes.length} medical schemes`));

    // For new files or if no uid is provided, return a template
    if (!uid || uid === 'new') {
      console.log(chalk.yellow('📄 API: New file template requested'));
      return {
        data: {
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
              scheme_id: '',
              name: '',
              membership_number: '',
              dependent_code: ''
            }
          },
          medical_schemes: medicalSchemes // Added medical schemes to response
        },
        status: 200
      };
    }

    console.log(chalk.cyan(`🏢 API: Fetching file with UID: ${uid}`));

    // Find the file info record with expanded relationships
    const fileInfo = await prisma.file_info.findFirst({
      where: {
        uid: uid,
        active: true,
        orgid: orgId
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
            medical_scheme: true,
            patientmedicalaid_file_patient: {
              where: {
                active: true
              },
              include: {
                patient: true
              }
            }
          }
        },
        injury_on_duty: {
          where: {
            active: true
          }
        }
      },
    });

    if (!fileInfo) {
      console.log(chalk.yellow(`📭 API: File with UID ${uid} not found`));
      return { error: 'File not found', status: 404 };
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
    
    // Get injury on duty info if it exists
    const injuryOnDuty = fileInfo.injury_on_duty.length > 0
      ? fileInfo.injury_on_duty[0]
      : null;
    
    // Determine cover type based on available data
    let coverType = 'private'; // Default
    if (medicalAid) {
      coverType = 'medical-aid';
    } else if (injuryOnDuty) {
      coverType = 'injury-on-duty';
    }
    
    // Get medical aid member info if available
    let memberPatient = null;
    let isSameAsPatient = false;
    
    if (medicalAid && medicalAid.patientmedicalaid_file_patient.length > 0) {
      // Check if the linked patient is different from the main patient
      const linkRecord = medicalAid.patientmedicalaid_file_patient[0];
      if (linkRecord.patientid !== patient?.uid) {
        memberPatient = linkRecord.patient;
      } else {
        // If same as the main patient, set the flag
        isSameAsPatient = true;
      }
    }
    
    // Format member date of birth if exists
    let formattedMemberDob = '';
    if (memberPatient?.date_of_birth) {
      const dob = new Date(memberPatient.date_of_birth);
      formattedMemberDob = `${dob.getFullYear()}/${String(dob.getMonth() + 1).padStart(2, '0')}/${String(dob.getDate()).padStart(2, '0')}`;
    }

    // Return the file data with expanded fields
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
        dob: patient?.date_of_birth ? `${new Date(patient.date_of_birth).getFullYear()}/${String(new Date(patient.date_of_birth).getMonth() + 1).padStart(2, '0')}/${String(new Date(patient.date_of_birth).getDate()).padStart(2, '0')}` : '',
        gender: patient?.gender || '',
        cell_phone: patient?.cell_phone || '',
        additional_name: patient?.additional_name || '',
        additional_cell: patient?.additional_cell || '',
        email: patient?.email || '',
        address: patient?.address || ''
      },
      medical_cover: {
        type: coverType,
        same_as_patient: isSameAsPatient,
        member: memberPatient ? {
          id: memberPatient.id || '',
          title: memberPatient.title || '',
          name: memberPatient.name || '',
          initials: memberPatient.initials || '',
          surname: memberPatient.surname || '',
          dob: formattedMemberDob,
          gender: memberPatient.gender || '',
          cell: memberPatient.cell_phone || '',
          email: memberPatient.email || '',
          address: memberPatient.address || ''
        } : {
          id: '',
          name: '',
          initials: '',
          surname: '',
          dob: '',
          cell: '',
          email: '',
          address: ''
        },
        medical_aid: medicalAid ? {
          scheme_id: medicalAid.medical_scheme_id || '',
          name: medicalAid.medical_scheme?.scheme_name || '',
          membership_number: medicalAid.membership_number || '',
          dependent_code: medicalAid.patient_dependant_code || ''
        } : {
          scheme_id: '',
          name: '',
          membership_number: '',
          dependent_code: ''
        },
        injury_on_duty: injuryOnDuty ? {
          company_name: injuryOnDuty.company_name || '',
          contact_person: injuryOnDuty.contact_person || '',
          contact_number: injuryOnDuty.contact_number || '',
          contact_email: injuryOnDuty.contact_email || ''
        } : {
          company_name: '',
          contact_person: '',
          contact_number: '',
          contact_email: ''
        }
      },
      medical_schemes: medicalSchemes // From existing code
    };

    console.log(chalk.green('✅ API: File data retrieved successfully'));
    return { data: fileData, status: 200 };
  } catch (error) {
    console.error(chalk.red('💥 API: Error fetching file:'), error);
    return { error: 'Failed to fetch file', status: 500 };
  }
}
