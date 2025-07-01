import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { auth } from '@/app/lib/auth';
import { Logger } from '@/app/lib/logger';

export async function GET(): Promise<NextResponse> {
  const logger = Logger.getInstance();
  await logger.init();

  try {
    await logger.info('api/files/route.ts', 'GET /api/files endpoint called');

    const session = await auth();
    if (!session?.user?.orgId) {
      await logger.warning(
        'api/files/route.ts',
        'No organization ID found in session'
      );
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await logger.info(
      'api/files/route.ts',
      `Fetching files for organization ID: ${session.user.orgId}`
    );

    // Query directly from file_info table - this is the main table
    // All files should be fetched even if there is no associated patient
    const fileInfos = await prisma.file_info.findMany({
      where: {
        active: true,
        orgid: session.user.orgId,
      },
      include: {
        // Include the relationship to patient through fileinfo_patient
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
          },
        },
      },
    });

    await logger.info(
      'api/files/route.ts',
      `Raw query result count: ${fileInfos.length}`
    );

    if (fileInfos.length > 0) {
      const filesWithPatients = fileInfos.filter(
        f => f.fileinfo_patient.length > 0
      );
      const filesWithoutPatients = fileInfos.filter(
        f => f.fileinfo_patient.length === 0
      );

      await logger.debug(
        'api/files/route.ts',
        `Files with patients: ${filesWithPatients.length}`
      );
      await logger.debug(
        'api/files/route.ts',
        `Files without patients: ${filesWithoutPatients.length}`
      );

      if (fileInfos.length > 0 && fileInfos[0]) {
        await logger.debug(
          'api/files/route.ts',
          `Sample file_info record: ${JSON.stringify({
            uid: fileInfos[0].uid,
            file_number: fileInfos[0].file_number,
            account_number: fileInfos[0].account_number,
            has_patient_relations: fileInfos[0].fileinfo_patient.length > 0,
          })}`
        );
      }
    } else {
      await logger.info('api/files/route.ts', 'No records found');
    }

    // Transform data to handle cases where patient info might not exist
    const files = fileInfos.map(fileInfo => {
      // Get the first linked patient if it exists
      const filePatient =
        fileInfo.fileinfo_patient.length > 0
          ? fileInfo.fileinfo_patient[0]
          : null;
      const patient = filePatient?.patient || null;

      return {
        uid: fileInfo.uid,
        file_number: fileInfo.file_number || '',
        account_number: fileInfo.account_number || '',
        patient: {
          id: patient?.id || '',
          name: patient?.name || '',
          gender: patient?.gender || '',
        },
      };
    });

    await logger.info(
      'api/files/route.ts',
      `Transformed response count: ${files.length}`
    );

    if (files.length > 0) {
      const filesWithPatientInfo = files.filter(
        f => f.patient.id || f.patient.name
      );
      const filesWithoutPatientInfo = files.filter(
        f => !f.patient.id && !f.patient.name
      );

      await logger.debug(
        'api/files/route.ts',
        `Files with patient info: ${filesWithPatientInfo.length}`
      );
      await logger.debug(
        'api/files/route.ts',
        `Files without patient info: ${filesWithoutPatientInfo.length}`
      );

      if (files.length > 0 && files[0]) {
        await logger.debug(
          'api/files/route.ts',
          `Sample transformed record: ${JSON.stringify(files[0])}`
        );

        if (filesWithoutPatientInfo.length > 0 && filesWithoutPatientInfo[0]) {
          await logger.debug(
            'api/files/route.ts',
            `Sample file without patient info: ${JSON.stringify(filesWithoutPatientInfo[0])}`
          );
        }
      }
    } else {
      await logger.warning('api/files/route.ts', 'No records after transform');
    }

    return NextResponse.json(files);
  } catch (error) {
    await logger.error(
      'api/files/route.ts',
      `Error fetching files: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return NextResponse.json(
      { error: 'Failed to fetch files', files: [] },
      { status: 500 }
    );
  }
}
