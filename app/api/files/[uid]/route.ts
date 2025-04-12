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

// For updating an existing file
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
    console.log(chalk.cyan('📦 API: Received data for update:'), data);

    // Update the file info
    const updatedFileInfo = await prisma.file_info.update({
      where: {
        uid: params.uid,
        orgid: session.user.orgId
      },
      data: {
        file_number: data.file_number,
        account_number: data.account_number,
        last_edit: new Date()
      }
    });

    // Handle patient information - more complex as it involves relationships
    if (data.patient) {
      // Check if there's already a patient relationship
      const existingRelation = await prisma.fileinfo_patient.findFirst({
        where: {
          fileid: params.uid,
          active: true
        },
        include: {
          patient: true
        }
      });

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

      if (existingRelation) {
        // Update existing patient
        await prisma.patient.update({
          where: {
            uid: existingRelation.patient.uid
          },
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
      } else if (data.patient.name || data.patient.surname) {
        // Create new patient
        const newPatient = await prisma.patient.create({
          data: {
            uid: uuidv4(),
            id: data.patient.id || uuidv4(),
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

        // Create the relationship
        await prisma.fileinfo_patient.create({
          data: {
            uid: uuidv4(),
            fileid: params.uid,
            patientid: newPatient.uid,
            orgid: session.user.orgId,
            active: true,
            date_created: new Date(),
            last_edit: new Date()
          }
        });
      }
    }

    // Handle medical cover information
    if (data.medical_cover) {
      // Processing medical aid if medical-aid type is selected
      if (data.medical_cover.type === 'medical-aid' && data.medical_cover.medical_aid) {
        // Find existing medical aid record
        const existingMedicalAid = await prisma.patient_medical_aid.findFirst({
          where: {
            fileid: params.uid,
            active: true
          }
        });
        
        // Get or create medical scheme
        let schemeId;
        
        if (data.medical_cover.medical_aid.name) {
          const medicalScheme = await prisma.medical_scheme.findFirst({
            where: {
              scheme_name: data.medical_cover.medical_aid.name,
              active: true
            }
          });
          
          if (medicalScheme) {
            schemeId = medicalScheme.uid;
          } else {
            // Create new medical scheme
            const newScheme = await prisma.medical_scheme.create({
              data: {
                uid: uuidv4(),
                scheme_name: data.medical_cover.medical_aid.name,
                active: true,
                date_created: new Date(),
                last_edit: new Date(),
                orgid: session.user.orgId
              }
            });
            schemeId = newScheme.uid;
          }
        }
        
        if (existingMedicalAid) {
          // Update existing medical aid
          await prisma.patient_medical_aid.update({
            where: {
              uid: existingMedicalAid.uid
            },
            data: {
              medical_scheme_id: schemeId,
              membership_number: data.medical_cover.medical_aid.membership_number,
              patient_dependant_code: data.medical_cover.medical_aid.dependent_code,
              last_edit: new Date()
            }
          });
        } else if (schemeId) {
          // Create new medical aid record
          await prisma.patient_medical_aid.create({
            data: {
              uid: uuidv4(),
              medical_scheme_id: schemeId,
              membership_number: data.medical_cover.medical_aid.membership_number || '',
              patient_dependant_code: data.medical_cover.medical_aid.dependent_code || '',
              fileid: params.uid,
              orgid: session.user.orgId,
              active: true,
              date_created: new Date(),
              last_edit: new Date()
            }
          });
        }
      }
    }

    // Fetch the updated data to return
    const updatedFile = await prisma.file_info.findFirst({
      where: {
        uid: params.uid,
        active: true
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
      }
    });

    // Get the first linked patient if it exists
    const filePatient = updatedFile?.fileinfo_patient.length ? updatedFile.fileinfo_patient[0] : null;
    const patient = filePatient?.patient || null;
    
    // Get medical aid info if it exists
    const medicalAid = updatedFile?.patient_medical_aid.length ? updatedFile.patient_medical_aid[0] : null;

    // Format date of birth if it exists
    let formattedDob = '';
    if (patient?.date_of_birth) {
      const dob = new Date(patient.date_of_birth);
      formattedDob = `${dob.getFullYear()}/${String(dob.getMonth() + 1).padStart(2, '0')}/${String(dob.getDate()).padStart(2, '0')}`;
    }

    // Return the updated file data
    const responseData = {
      uid: updatedFile?.uid,
      file_number: updatedFile?.file_number || '',
      account_number: updatedFile?.account_number || '',
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
        same_as_patient: data.medical_cover?.same_as_patient || false,
        member: {
          id: data.medical_cover?.member?.id || '',
          name: data.medical_cover?.member?.name || '',
          initials: data.medical_cover?.member?.initials || '',
          surname: data.medical_cover?.member?.surname || '',
          dob: data.medical_cover?.member?.dob || '',
          cell: data.medical_cover?.member?.cell || '',
          email: data.medical_cover?.member?.email || '',
          address: data.medical_cover?.member?.address || ''
        },
        medical_aid: {
          name: medicalAid?.medical_scheme?.scheme_name || '',
          membership_number: medicalAid?.membership_number || '',
          dependent_code: medicalAid?.patient_dependant_code || ''
        }
      }
    };

    console.log(chalk.green('✅ API: File updated successfully'));
    return NextResponse.json(responseData);
  } catch (error) {
    console.error(chalk.red('💥 API: Error updating file:'), error);
    return NextResponse.json({ error: 'Failed to update file' }, { status: 500 });
  }
}

// POST endpoint to create a new file
export async function POST(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    console.log(chalk.blue.bold(`🔍 API: /api/files/${params.uid} POST called`));
    const session = await auth();
    if (!session?.user?.orgId) {
      console.log(chalk.red('❌ API: No organization ID found in session'));
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    console.log(chalk.cyan('📦 API: Received data for new file:'), data);

    // Generate a new file UID if not provided
    const fileUid = params.uid === 'new' ? uuidv4() : params.uid;

    // Create the file_info record
    const newFileInfo = await prisma.file_info.create({
      data: {
        uid: fileUid,
        file_number: data.file_number || '',
        account_number: data.account_number || '',
        orgid: session.user.orgId,
        active: true,
        date_created: new Date(),
        last_edit: new Date()
      }
    });

    // Handle patient information if provided
    let patientId = '';
    if (data.patient && (data.patient.name || data.patient.id_number || data.patient.gender || data.patient.title)) {
      // Create patient record with expanded fields from schema
      const newPatient = await prisma.patient.create({
        data: {
          uid: uuidv4(),
          id: data.patient.id || uuidv4(),
          title: data.patient.title || '',
          name: data.patient.name || '',
          initials: data.patient.initials || '',
          surname: data.patient.surname || '',
          date_of_birth: data.patient.dob ? new Date(data.patient.dob) : null,
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
      
      patientId = newPatient.uid;

      // Create the relationship between file and patient
      await prisma.fileinfo_patient.create({
        data: {
          uid: uuidv4(),
          fileid: fileUid,
          patientid: patientId,
          orgid: session.user.orgId,
          active: true,
          date_created: new Date(),
          last_edit: new Date()
        }
      });
    }

    // Create response data object with expanded patient fields
    const responseData = {
      uid: newFileInfo.uid,
      file_number: newFileInfo.file_number || '',
      account_number: newFileInfo.account_number || '',
      patient: {
        id: patientId || '',
        title: data.patient?.title || '',
        name: data.patient?.name || '',
        initials: data.patient?.initials || '',
        surname: data.patient?.surname || '',
        dob: data.patient?.dob || '',
        gender: data.patient?.gender || '',
        cell_phone: data.patient?.cell_phone || '',
        additional_name: data.patient?.additional_name || '',
        additional_cell: data.patient?.additional_cell || '',
        email: data.patient?.email || '',
        address: data.patient?.address || ''
      },
      medical_cover: {
        type: data.medical_cover?.type || 'medical-aid',
        same_as_patient: data.medical_cover?.same_as_patient || false,
        member: {
          id: data.medical_cover?.member?.id || '',
          name: data.medical_cover?.member?.name || '',
          initials: data.medical_cover?.member?.initials || '',
          surname: data.medical_cover?.member?.surname || '',
          dob: data.medical_cover?.member?.dob || '',
          cell: data.medical_cover?.member?.cell || '',
          email: data.medical_cover?.member?.email || '',
          address: data.medical_cover?.member?.address || ''
        },
        medical_aid: {
          name: data.medical_cover?.medical_aid?.name || '',
          membership_number: data.medical_cover?.medical_aid?.membership_number || '',
          dependent_code: data.medical_cover?.medical_aid?.dependent_code || ''
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
