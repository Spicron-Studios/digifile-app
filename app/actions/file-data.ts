'use server';

import { auth } from '@/app/lib/auth';
import {
  getFileData,
  createFile as svcCreateFile,
  updateFile as svcUpdateFile,
  saveNoteWithFiles as svcSaveNoteWithFiles,
  saveNoteSmart as svcSaveNoteSmart,
} from '@/app/lib/services/file-data.service';

export async function getFile(uid: string) {
  const session = await auth();
  if (!session?.user?.orgId) throw new Error('Unauthorized');
  const res = await getFileData(uid, session.user.orgId);
  if ('error' in res && res.error) throw new Error(res.error);
  return res.data;
}

export async function createFile(payload: Record<string, unknown>) {
  const session = await auth();
  if (!session?.user?.orgId) throw new Error('Unauthorized');
  const res = await svcCreateFile(payload, session.user.orgId);
  if ('error' in res && res.error) throw new Error(res.error);
  return res.data;
}

export async function updateFile(
  uid: string,
  payload: Record<string, unknown>
) {
  const session = await auth();
  if (!session?.user?.orgId) throw new Error('Unauthorized');
  const res = await svcUpdateFile(uid, payload, session.user.orgId);
  if ('error' in res && res.error) throw new Error(res.error);
  return res.data;
}

export async function createNoteWithFiles(payload: {
  fileInfoPatientId: string;
  patientId: string;
  timeStamp: string;
  notes: string;
  tabType: string;
  files?: Array<{
    name: string;
    type: string;
    content: string;
  }>;
}) {
  const session = await auth();
  if (!session?.user?.orgId) throw new Error('Unauthorized');

  // Construct proper NoteData object
  const notePayload = {
    orgId: session.user.orgId,
    fileInfoPatientId: payload.fileInfoPatientId,
    patientId: payload.patientId,
    timeStamp: payload.timeStamp,
    notes: payload.notes,
    tabType: payload.tabType,
    files: payload.files || [],
  };

  const res = await svcSaveNoteWithFiles(notePayload);
  if (res.error) throw new Error(res.error);
  return res;
}

export async function createNoteSmart(payload: {
  fileUid: string;
  patientIdNumber?: string;
  timeStamp: string;
  notes: string;
  tabType: string;
  files?: Array<{
    name: string;
    type: string;
    content: string;
  }>;
}) {
  const session = await auth();
  if (!session?.user?.orgId) throw new Error('Unauthorized');

  const smartPayload = {
    orgId: session.user.orgId,
    fileUid: payload.fileUid,
    patientIdNumber: payload.patientIdNumber,
    timeStamp: payload.timeStamp,
    notes: payload.notes,
    tabType: payload.tabType,
    files: payload.files || [],
  };

  const res = await svcSaveNoteSmart(smartPayload);
  if (res.error) throw new Error(res.error);
  return res;
}
