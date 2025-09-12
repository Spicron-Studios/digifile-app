import db, { medicalScheme, tabNotes, tabFiles } from '@/app/lib/drizzle';
import { Logger } from '@/app/lib/logger';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, asc } from 'drizzle-orm';
import { DbWriteResponse, NoteData, TabNoteRecord } from '@/app/types/db-types';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to fetch medical schemes
export async function fetchMedicalSchemes(
  orgId: string
): Promise<Array<{ uid: string; scheme_name: string | null }>> {
  const logger = Logger.getInstance();
  await logger.init();

  try {
    // Fetch active medical schemes for the organization
    const schemes = await db
      .select({
        uid: medicalScheme.uid,
        scheme_name: medicalScheme.schemeName,
      })
      .from(medicalScheme)
      .where(
        and(eq(medicalScheme.active, true), eq(medicalScheme.orgid, orgId))
      )
      .orderBy(asc(medicalScheme.schemeName));

    return schemes;
  } catch (error) {
    await logger.error(
      'api/files/[uid]/other_fn.ts',
      `Error fetching medical schemes: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return [];
  }
}

// Helper function to save a new note and its files
export async function saveNoteWithFiles(
  noteData: NoteData
): Promise<DbWriteResponse<TabNoteRecord>> {
  const logger = Logger.getInstance();
  await logger.init();

  try {
    await logger.info('api/files/[uid]/other_fn.ts', 'Saving new note');

    // 1. Create the note record in tab_notes
    const noteUid = uuidv4();
    await db.insert(tabNotes).values({
      uid: noteUid,
      orgid: noteData.orgId,
      fileinfoPatientId: noteData.fileInfoPatientId,
      personid: noteData.patientId,
      timeStamp: new Date(noteData.timeStamp).toISOString(),
      notes: noteData.notes,
      tabType: noteData.tabType, // 'file' or 'clinical'
      active: true,
      dateCreated: new Date().toISOString(),
      lastEdit: new Date().toISOString(),
      locked: false,
    });

    await logger.info(
      'api/files/[uid]/other_fn.ts',
      `Note created with ID: ${noteUid}`
    );

    // 2. Upload files to Supabase and create records in tab_files
    const fileRecords: Array<{
      uid: string;
      file_name: string | null;
      file_type: string | null;
      file_location: string | null;
    }> = [];

    if (noteData.files && noteData.files.length > 0) {
      await logger.debug(
        'api/files/[uid]/other_fn.ts',
        `Processing ${noteData.files.length} files`
      );

      for (const fileData of noteData.files) {
        // Generate a unique filename while preserving the extension
        const fileExtension = fileData.name.split('.').pop();
        const uniqueFileName = `${uuidv4()}.${fileExtension}`;
        const storageLocation = `${noteData.orgId}/note-docs/${uniqueFileName}`;

        // Upload to Supabase
        const { error } = await supabase.storage
          .from('note-docs')
          .upload(storageLocation, fileData.content);

        if (error) {
          await logger.error(
            'api/files/[uid]/other_fn.ts',
            `Error uploading file: ${error.message}`
          );
          continue;
        }

        // Create record in tab_files
        const fileUid = uuidv4();
        await db.insert(tabFiles).values({
          uid: fileUid,
          orgid: noteData.orgId,
          tabNotesId: noteUid,
          fileName: fileData.name,
          fileType: fileData.type,
          fileLocation: storageLocation,
          active: true,
          dateCreated: new Date().toISOString(),
          lastEdit: new Date().toISOString(),
          locked: false,
        });

        fileRecords.push({
          uid: fileUid,
          file_name: fileData.name,
          file_type: fileData.type,
          file_location: storageLocation,
        });

        await logger.info(
          'api/files/[uid]/other_fn.ts',
          `File uploaded and record created for ${fileData.name}`
        );
      }
    }

    // 3. Return the complete note data with file records
    const completeNote: TabNoteRecord = {
      uid: noteUid,
      time_stamp: new Date(noteData.timeStamp).toISOString(),
      notes: noteData.notes,
      tab_type: noteData.tabType,
      files: fileRecords,
    };

    await logger.info(
      'api/files/[uid]/other_fn.ts',
      'Note saved successfully with all files'
    );
    return { data: completeNote, status: 200 };
  } catch (error) {
    await logger.error(
      'api/files/[uid]/other_fn.ts',
      `Error saving note: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return { error: 'Failed to save note', status: 500 };
  }
}
