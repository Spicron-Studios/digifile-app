'use server';

import db, { fileInfo, fileinfoPatient, patient } from '@/app/lib/drizzle';
import { auth } from '@/app/lib/auth';
import { Logger } from '@/app/lib/logger/logger.service';
import { eq, and } from 'drizzle-orm';

export type FileListItem = {
  uid: string;
  file_number: string;
  account_number: string;
  patient: { id: string; name: string; gender: string };
};

export async function getFiles(): Promise<FileListItem[]> {
  const logger = Logger.getInstance();
  await logger.init();

  const session = await auth();
  if (!session?.user?.orgId) {
    await logger.warning('actions/files.ts', 'Unauthorized: missing orgId');
    return [];
  }

  await logger.info(
    'actions/files.ts',
    `Fetching files for orgId=${session.user.orgId}`
  );

  // Using left join to get files with or without patients
  const fileInfos = await db
    .select({
      uid: fileInfo.uid,
      file_number: fileInfo.fileNumber,
      account_number: fileInfo.accountNumber,
      patient_id: patient.id,
      patient_name: patient.name,
      patient_gender: patient.gender,
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
      and(eq(patient.uid, fileinfoPatient.patientid), eq(patient.active, true))
    )
    .where(
      and(eq(fileInfo.active, true), eq(fileInfo.orgid, session.user.orgId))
    );

  const files: FileListItem[] = fileInfos.map(fi => ({
    uid: fi.uid,
    file_number: fi.file_number ?? '',
    account_number: fi.account_number ?? '',
    patient: {
      id: fi.patient_id ?? '',
      name: fi.patient_name ?? '',
      gender: fi.patient_gender ?? '',
    },
  }));

  await logger.info('actions/files.ts', `Returning ${files.length} files`);
  return files;
}
