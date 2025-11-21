import { handleGetFileData } from "@/app/api/files/[uid]/db_read";
import {
	handleCreateFile,
	handleDeleteFile,
	handleUpdateFile,
} from "@/app/api/files/[uid]/db_write";
import {
	deleteNote as _deleteNote,
	fetchMedicalSchemes as _fetchMedicalSchemes,
	getSignedFileUrl as _getSignedFileUrl,
	saveNoteSmart as _saveNoteSmart,
	saveNoteWithFiles as _saveNoteWithFiles,
	updateNoteWithFiles as _updateNoteWithFiles,
} from "@/app/api/files/[uid]/other_fn";
import type {
	DbWriteResponse,
	NoteData,
	SmartNoteData,
} from "@/app/types/db-types";

export async function getFileData(
	uid: string,
	orgId: string,
): Promise<{ data?: unknown; error?: string; status: number }> {
	return handleGetFileData(uid, orgId);
}

export async function createFile(
	data: Record<string, unknown>,
	orgId: string,
): Promise<DbWriteResponse> {
	return handleCreateFile(
		data as unknown as import("@/app/types/db-types").FileCreateData,
		orgId,
	);
}

export async function updateFile(
	uid: string,
	data: Record<string, unknown>,
	orgId: string,
): Promise<DbWriteResponse> {
	return handleUpdateFile(
		uid,
		data as unknown as import("@/app/types/db-types").FileUpdateData,
		orgId,
	);
}

export async function deleteFile(
	uid: string,
	orgId: string,
): Promise<DbWriteResponse> {
	return handleDeleteFile(uid, orgId);
}

export async function saveNoteWithFiles(
	payload: NoteData,
): Promise<DbWriteResponse<import("@/app/types/db-types").TabNoteRecord>> {
	return _saveNoteWithFiles(payload);
}

export async function saveNoteSmart(
	payload: SmartNoteData,
): Promise<DbWriteResponse<import("@/app/types/db-types").TabNoteRecord>> {
	return _saveNoteSmart(payload);
}

export async function updateNoteWithFiles(payload: {
	orgId: string;
	noteUid: string;
	notes: string;
	files?: Array<{ name: string; type: string; content: string }> | undefined;
}): Promise<DbWriteResponse<import("@/app/types/db-types").TabNoteRecord>> {
	return _updateNoteWithFiles(payload);
}

export async function deleteNote(payload: {
	orgId: string;
	noteUid: string;
}): Promise<DbWriteResponse<null>> {
	return _deleteNote(payload);
}

export async function fetchMedicalSchemes(
	orgId: string,
): Promise<Array<{ uid: string; scheme_name: string | null }>> {
	return _fetchMedicalSchemes(orgId);
}

export async function getSignedFileUrl(
	orgId: string,
	fileLocation: string,
): Promise<DbWriteResponse<string>> {
	return _getSignedFileUrl({ orgId, fileLocation });
}
