'use server';

import { auth } from '@/app/lib/auth';
import { handleGetFileData } from '@/app/api/files/[uid]/db_read';
import {
  handleCreateFile,
  handleUpdateFile,
} from '@/app/api/files/[uid]/db_write';
import { saveNoteWithFiles } from '@/app/api/files/[uid]/other_fn';

export async function getFile(uid: string) {
  const session = await auth();
  if (!session?.user?.orgId) throw new Error('Unauthorized');
  const res = await handleGetFileData(uid, session.user.orgId);
  if ('error' in res && res.error) throw new Error(res.error);
  return res.data;
}

export async function createFile(payload: Record<string, unknown>) {
  const session = await auth();
  if (!session?.user?.orgId) throw new Error('Unauthorized');
  const res = await handleCreateFile(payload, session.user.orgId);
  if ('error' in res && res.error) throw new Error(res.error);
  return res.data;
}

export async function updateFile(
  uid: string,
  payload: Record<string, unknown>
) {
  const session = await auth();
  if (!session?.user?.orgId) throw new Error('Unauthorized');
  const res = await handleUpdateFile(uid, payload, session.user.orgId);
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

  return saveNoteWithFiles(notePayload);
}
