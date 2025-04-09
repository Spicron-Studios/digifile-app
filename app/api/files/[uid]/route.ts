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
        test: 'Hello World',
        patient: {
          id: '',
          name: '',
          gender: '',
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

    // Return the file data with the test property
    const fileData = {
      uid: fileInfo.uid,
      file_number: fileInfo.file_number || '',
      account_number: fileInfo.account_number || '',
      test: 'Hello World', // Add the test property as required
      patient: {
        id: patient?.id || '',
        name: patient?.name || '',
        gender: patient?.gender || '',
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

      if (existingRelation) {
        // Update existing patient
        await prisma.patient.update({
          where: {
            id: existingRelation.patient.id
          },
          data: {
            name: data.patient.name,
            gender: data.patient.gender,
            last_edit: new Date()
          }
        });
      } else if (data.patient.name || data.patient.gender) {
        // Create new patient and relationship
        const newPatient = await prisma.patient.create({
          data: {
            id: data.patient.id || uuidv4(),
            name: data.patient.name,
            gender: data.patient.gender,
            orgid: session.user.orgId,
            active: true
          }
        });

        // Create the relationship
        await prisma.fileinfo_patient.create({
          data: {
            uid: uuidv4(),
            fileid: params.uid,
            patientid: newPatient.id,
            orgid: session.user.orgId,
            active: true
          }
        });
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
        }
      }
    });

    // Get the first linked patient if it exists
    const filePatient = updatedFile?.fileinfo_patient.length ? updatedFile.fileinfo_patient[0] : null;
    const patient = filePatient?.patient || null;

    // Return the updated file data
    const responseData = {
      uid: updatedFile?.uid,
      file_number: updatedFile?.file_number || '',
      account_number: updatedFile?.account_number || '',
      test: 'Hello World', // Add the test property as required
      patient: {
        id: patient?.id || '',
        name: patient?.name || '',
        gender: patient?.gender || '',
      }
    };

    console.log(chalk.green('✅ API: File updated successfully'));
    return NextResponse.json(responseData);
  } catch (error) {
    console.error(chalk.red('💥 API: Error updating file:'), error);
    return NextResponse.json({ error: 'Failed to update file' }, { status: 500 });
  }
}
