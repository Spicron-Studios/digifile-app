import prisma from '@/app/lib/prisma';
import { Logger } from '@/app/lib/logger';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

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
    const schemes = await prisma.medical_scheme.findMany({
      where: {
        active: true,
        orgid: orgId,
      },
      select: {
        uid: true,
        scheme_name: true,
      },
      orderBy: {
        scheme_name: 'asc',
      },
    });

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
export async function saveNoteWithFiles(noteData: any): Promise<any> {
  const logger = Logger.getInstance();
  await logger.init();

  try {
    await logger.info('api/files/[uid]/other_fn.ts', 'Saving new note');

    // 1. Create the note record in tab_notes
    const newNote = await prisma.tab_notes.create({
      data: {
        uid: uuidv4(),
        orgid: noteData.orgId,
        fileinfo_patient_id: noteData.fileInfoPatientId,
        personid: noteData.patientId,
        time_stamp: new Date(noteData.timeStamp),
        notes: noteData.notes,
        tab_type: noteData.tabType, // 'file' or 'clinical'
        active: true,
        date_created: new Date(),
        last_edit: new Date(),
      },
    });

    await logger.info(
      'api/files/[uid]/other_fn.ts',
      `Note created with ID: ${newNote.uid}`
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
        const fileRecord = await prisma.tab_files.create({
          data: {
            uid: uuidv4(),
            orgid: noteData.orgId,
            tab_notes_id: newNote.uid,
            file_name: fileData.name,
            file_type: fileData.type,
            file_location: storageLocation,
            active: true,
            date_created: new Date(),
            last_edit: new Date(),
          },
        });

        fileRecords.push({
          uid: fileRecord.uid,
          file_name: fileRecord.file_name,
          file_type: fileRecord.file_type,
          file_location: fileRecord.file_location,
        });

        await logger.info(
          'api/files/[uid]/other_fn.ts',
          `File uploaded and record created for ${fileData.name}`
        );
      }
    }

    // 3. Return the complete note data with file records
    const completeNote = {
      uid: newNote.uid,
      time_stamp: newNote.time_stamp,
      notes: newNote.notes,
      tab_type: newNote.tab_type,
      files: fileRecords,
    };

    await logger.info(
      'api/files/[uid]/other_fn.ts',
      'Note saved successfully with all files'
    );
    return completeNote;
  } catch (error) {
    await logger.error(
      'api/files/[uid]/other_fn.ts',
      `Error saving note: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    throw error;
  }
}
