import prisma from '@/app/lib/prisma';
import { Logger } from '@/app/lib/logger';
import { fetchMedicalSchemes } from './other_fn';

// Handle GET requests for file data
export async function handleGetFileData(uid: string, orgId: string) {
  const logger = Logger.getInstance();
  await logger.init();

  try {
    await logger.info(
      'api/files/[uid]/db_read.ts',
      `Getting file data for UID: ${uid}`
    );

    // Fetch medical schemes
    const medicalSchemes = await fetchMedicalSchemes(orgId);
    await logger.debug(
      'api/files/[uid]/db_read.ts',
      `🏥 API: Fetched ${medicalSchemes.length} medical schemes`
    );

    // For new files or if no uid is provided, return a template
    if (!uid || uid === 'new') {
      await logger.debug(
        'api/files/[uid]/db_read.ts',
        '📄 API: New file template requested'
      );
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
            address: '',
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
              address: '',
            },
            medical_aid: {
              scheme_id: '',
              name: '',
              membership_number: '',
              dependent_code: '',
            },
          },
          notes: {
            file_notes: [],
            clinical_notes: [],
          },
          medical_schemes: medicalSchemes, // Added medical schemes to response
        },
        status: 200,
      };
    }

    await logger.info(
      'api/files/[uid]/db_read.ts',
      `🏢 API: Fetching file with UID: ${uid}`
    );

    // Find the file info record with expanded relationships
    const fileInfo = await prisma.file_info.findFirst({
      where: {
        uid: uid,
        active: true,
        orgid: orgId,
      },
      include: {
        fileinfo_patient: {
          where: {
            active: true,
          },
          include: {
            patient: {
              where: {
                active: true,
              },
            },
            tab_notes: {
              where: {
                active: true,
              },
              include: {
                tab_files: {
                  where: {
                    active: true,
                  },
                },
              },
              orderBy: {
                time_stamp: 'desc',
              },
            },
          },
        },
        patient_medical_aid: {
          where: {
            active: true,
          },
          include: {
            medical_scheme: true,
            patientmedicalaid_file_patient: {
              where: {
                active: true,
              },
              include: {
                patient: true,
              },
            },
          },
        },
        injury_on_duty: {
          where: {
            active: true,
          },
        },
      },
    });

    if (!fileInfo) {
      await logger.warning(
        'api/files/[uid]/db_read.ts',
        `📭 API: File with UID ${uid} not found`
      );
      return { error: 'File not found', status: 404 };
    }

    // Get the first linked patient if it exists
    const filePatient =
      fileInfo.fileinfo_patient.length > 0
        ? fileInfo.fileinfo_patient[0]
        : null;
    const patient = filePatient?.patient || null;

    // Get medical aid info if it exists
    const medicalAid =
      fileInfo.patient_medical_aid.length > 0
        ? fileInfo.patient_medical_aid[0]
        : null;

    // Get injury on duty info if it exists
    const injuryOnDuty =
      fileInfo.injury_on_duty.length > 0 ? fileInfo.injury_on_duty[0] : null;

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
      if (linkRecord && linkRecord.patientid !== patient?.uid) {
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

    // Process tab_notes and tab_files
    // Separate notes by type (file_notes or clinical_notes)
    const fileNotes = [];
    const clinicalNotes = [];

    // If filePatient exists, we can collect its tab_notes
    if (filePatient && filePatient.tab_notes) {
      for (const note of filePatient.tab_notes) {
        const noteObj = {
          uid: note.uid,
          time_stamp: note.time_stamp,
          notes: note.notes,
          tab_type: note.tab_type,
          files: note.tab_files.map(file => ({
            uid: file.uid,
            file_name: file.file_name,
            file_type: file.file_type,
            file_location: file.file_location,
          })),
        };

        // Sort notes based on tab_type
        if (note.tab_type === 'file') {
          fileNotes.push(noteObj);
        } else if (note.tab_type === 'clinical') {
          clinicalNotes.push(noteObj);
        }
      }
    }

    await logger.debug(
      'api/files/[uid]/db_read.ts',
      `📝 API: Fetched ${fileNotes.length} file notes and ${clinicalNotes.length} clinical notes`
    );

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
        dob: patient?.date_of_birth
          ? `${new Date(patient.date_of_birth).getFullYear()}/${String(new Date(patient.date_of_birth).getMonth() + 1).padStart(2, '0')}/${String(new Date(patient.date_of_birth).getDate()).padStart(2, '0')}`
          : '',
        gender: patient?.gender || '',
        cell_phone: patient?.cell_phone || '',
        additional_name: patient?.additional_name || '',
        additional_cell: patient?.additional_cell || '',
        email: patient?.email || '',
        address: patient?.address || '',
      },
      medical_cover: {
        type: coverType,
        same_as_patient: isSameAsPatient,
        member: memberPatient
          ? {
              id: memberPatient.id || '',
              title: memberPatient.title || '',
              name: memberPatient.name || '',
              initials: memberPatient.initials || '',
              surname: memberPatient.surname || '',
              dob: formattedMemberDob,
              gender: memberPatient.gender || '',
              cell: memberPatient.cell_phone || '',
              email: memberPatient.email || '',
              address: memberPatient.address || '',
            }
          : {
              id: '',
              name: '',
              initials: '',
              surname: '',
              dob: '',
              cell: '',
              email: '',
              address: '',
            },
        medical_aid: medicalAid
          ? {
              scheme_id: medicalAid.medical_scheme_id || '',
              name: medicalAid.medical_scheme?.scheme_name || '',
              membership_number: medicalAid.membership_number || '',
              dependent_code: medicalAid.patient_dependant_code || '',
            }
          : {
              scheme_id: '',
              name: '',
              membership_number: '',
              dependent_code: '',
            },
        injury_on_duty: injuryOnDuty
          ? {
              company_name: injuryOnDuty.company_name || '',
              contact_person: injuryOnDuty.contact_person || '',
              contact_number: injuryOnDuty.contact_number || '',
              contact_email: injuryOnDuty.contact_email || '',
            }
          : {
              company_name: '',
              contact_person: '',
              contact_number: '',
              contact_email: '',
            },
      },
      notes: {
        file_notes: fileNotes,
        clinical_notes: clinicalNotes,
      },
      medical_schemes: medicalSchemes, // From existing code
    };

    await logger.info(
      'api/files/[uid]/db_read.ts',
      '✅ API: File data retrieved successfully'
    );
    await logger.debug(
      'api/files/[uid]/db_read.ts',
      JSON.stringify(fileData, null, 2)
    );

    return { data: fileData, status: 200 };
  } catch (error) {
    await logger.error(
      'api/files/[uid]/db_read.ts',
      `💥 API: Error fetching file: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return { error: 'Failed to fetch file', status: 500 };
  }
}
