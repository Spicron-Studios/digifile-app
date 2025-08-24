import { NextResponse } from 'next/server';
import db, { fileInfo, fileinfoPatient, patient } from '@/app/lib/drizzle';
import { auth } from '@/app/lib/auth';
import { Logger } from '@/app/lib/logger';
import { eq, and } from 'drizzle-orm';

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

    // Query with left joins to get files with or without patients
    const fileInfos = await db
      .select({
        uid: fileInfo.uid,
        file_number: fileInfo.fileNumber,
        account_number: fileInfo.accountNumber,
        patient_id: patient.id,
        patient_name: patient.name,
        patient_gender: patient.gender,
        has_patient: fileinfoPatient.uid,
      })
      .from(fileInfo)
      .leftJoin(
        fileinfoPatient,
        and(
          eq(fileinfoPatient.fileid, fileInfo.uid),
          eq(fileinfoPatient.active, true)
        )
      )
      .leftJoin(
        patient,
        and(
          eq(patient.uid, fileinfoPatient.patientid),
          eq(patient.active, true)
        )
      )
      .where(
        and(eq(fileInfo.active, true), eq(fileInfo.orgid, session.user.orgId))
      );

    await logger.info(
      'api/files/route.ts',
      `Raw query result count: ${fileInfos.length}`
    );

    if (fileInfos.length > 0) {
      const filesWithPatients = fileInfos.filter(f => f.has_patient);
      const filesWithoutPatients = fileInfos.filter(f => !f.has_patient);

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
            has_patient_relations: !!fileInfos[0].has_patient,
          })}`
        );
      }
    } else {
      await logger.info('api/files/route.ts', 'No records found');
    }

    // Transform data to handle cases where patient info might not exist
    const files = fileInfos.map(fileRecord => ({
      uid: fileRecord.uid,
      file_number: fileRecord.file_number || '',
      account_number: fileRecord.account_number || '',
      patient: {
        id: fileRecord.patient_id || '',
        name: fileRecord.patient_name || '',
        gender: fileRecord.patient_gender || '',
      },
    }));

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
