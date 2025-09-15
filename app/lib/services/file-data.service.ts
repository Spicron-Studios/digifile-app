import { handleGetFileData } from '@/app/api/files/[uid]/db_read';
import {
  handleCreateFile,
  handleUpdateFile,
} from '@/app/api/files/[uid]/db_write';
import {
  fetchMedicalSchemes as _fetchMedicalSchemes,
  saveNoteWithFiles as _saveNoteWithFiles,
  saveNoteSmart as _saveNoteSmart,
} from '@/app/api/files/[uid]/other_fn';
import type {
  DbWriteResponse,
  NoteData,
  SmartNoteData,
} from '@/app/types/db-types';

export async function getFileData(
  uid: string,
  orgId: string
): Promise<{ data?: unknown; error?: string; status: number }> {
  return handleGetFileData(uid, orgId);
}

export async function createFile(
  data: Record<string, unknown>,
  orgId: string
): Promise<DbWriteResponse> {
  return handleCreateFile(
    data as unknown as import('@/app/types/db-types').FileCreateData,
    orgId
  );
}

export async function updateFile(
  uid: string,
  data: Record<string, unknown>,
  orgId: string
): Promise<DbWriteResponse> {
  return handleUpdateFile(
    uid,
    data as unknown as import('@/app/types/db-types').FileUpdateData,
    orgId
  );
}

export async function saveNoteWithFiles(
  payload: NoteData
): Promise<DbWriteResponse<import('@/app/types/db-types').TabNoteRecord>> {
  return _saveNoteWithFiles(payload);
}

export async function saveNoteSmart(
  payload: SmartNoteData
): Promise<DbWriteResponse<import('@/app/types/db-types').TabNoteRecord>> {
  return _saveNoteSmart(payload);
}

export async function fetchMedicalSchemes(
  orgId: string
): Promise<Array<{ uid: string; scheme_name: string | null }>> {
  return _fetchMedicalSchemes(orgId);
}
