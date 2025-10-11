import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import db, { tabNotes, tabFiles } from '@/app/lib/drizzle';
import { Logger } from '@/app/lib/logger';
import { getBucket } from '@/app/lib/storage';

export const runtime = 'nodejs';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest): Promise<NextResponse> {
  const logger = Logger.getInstance();
  await logger.init();

  try {
    const noteData = await request.json();

    // Validate the required fields
    if (!noteData.notes || !noteData.tabType || !noteData.timeStamp) {
      await logger.warning(
        'api/files/notes/route.ts',
        'Missing required fields in note creation request'
      );
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create a new note in the database
    const noteUid = uuidv4();
    await logger.debug(
      'api/files/notes/route.ts',
      `Creating note with fileinfoPatientId: ${noteData.fileInfoPatientId}`
    );

    await db.insert(tabNotes).values({
      uid: noteUid,
      orgid: noteData.orgId,
      fileinfoPatientId: noteData.fileInfoPatientId,
      personid: noteData.patientId,
      timeStamp: new Date(noteData.timeStamp).toISOString(),
      notes: noteData.notes,
      tabType: noteData.tabType,
      active: true,
      dateCreated: new Date().toISOString(),
      lastEdit: new Date().toISOString(),
      locked: false,
    });

    await logger.info(
      'api/files/notes/route.ts',
      `Note created with UID: ${noteUid}`
    );

    // Handle file uploads
    const fileRecords: Array<{
      uid: string;
      file_name: string | null;
      file_type: string | null;
      file_location: string | null;
    }> = [];

    if (noteData.files && noteData.files.length > 0) {
      await logger.debug(
        'api/files/notes/route.ts',
        `Processing ${noteData.files.length} files for note`
      );

      for (const fileData of noteData.files) {
        try {
          // Generate a unique filename while preserving the extension
          const fileExtension = fileData.name.split('.').pop();
          const uniqueFileName = `${uuidv4()}.${fileExtension}`;
          const storageLocation = `${noteData.orgId}/note-docs/${uniqueFileName}`;

          // Convert base64 to file
          const base64Data = fileData.content.split(';base64,').pop();
          const fileBuffer = Buffer.from(base64Data, 'base64');

          // Upload to Supabase
          const { error } = await supabase.storage
            .from(getBucket('ATTACHMENTS'))
            .upload(storageLocation, fileBuffer, {
              contentType: fileData.type,
            });

          if (error) {
            await logger.error(
              'api/files/notes/route.ts',
              `Supabase storage upload error: ${error.message}`
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

          await logger.debug(
            'api/files/notes/route.ts',
            `File uploaded and recorded: ${fileData.name}`
          );
        } catch (fileError) {
          await logger.error(
            'api/files/notes/route.ts',
            `Error processing file: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`
          );
        }
      }
    }

    // Return the complete note data with file records
    const completeNote = {
      uid: noteUid,
      time_stamp: new Date(noteData.timeStamp).toISOString(),
      notes: noteData.notes,
      tab_type: noteData.tabType,
      files: fileRecords,
    };

    await logger.info(
      'api/files/notes/route.ts',
      `Note creation completed with ${fileRecords.length} files`
    );
    return NextResponse.json(completeNote, { status: 201 });
  } catch (error) {
    await logger.error(
      'api/files/notes/route.ts',
      `Error creating note: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return NextResponse.json(
      { error: 'Failed to create note' },
      { status: 500 }
    );
  }
}
