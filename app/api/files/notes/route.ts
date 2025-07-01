import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import prisma from '@/app/lib/prisma';
import { Logger } from '@/app/lib/logger';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest): Promise<NextResponse> {
  const logger = Logger.getInstance();
  await logger.init();

  try {
    const data = await request.json();

    // Validate the required fields
    if (!data.notes || !data.tabType || !data.timeStamp) {
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
      `Creating note with fileInfoPatientId: ${data.fileInfoPatientId}`
    );

    const newNote = await prisma.tab_notes.create({
      data: {
        uid: noteUid,
        orgid: data.orgId,
        fileinfo_patient_id: data.fileInfoPatientId,
        personid: data.patientId,
        time_stamp: new Date(data.timeStamp),
        notes: data.notes,
        tab_type: data.tabType, // 'file' or 'clinical'
        active: true,
        date_created: new Date(),
        last_edit: new Date(),
      },
    });

    await logger.info(
      'api/files/notes/route.ts',
      `Note created with UID: ${newNote.uid}`
    );

    // Handle file uploads
    const fileRecords: Array<{
      uid: string;
      file_name: string | null;
      file_type: string | null;
      file_location: string | null;
    }> = [];

    if (data.files && data.files.length > 0) {
      await logger.debug(
        'api/files/notes/route.ts',
        `Processing ${data.files.length} files for note`
      );

      for (const fileData of data.files) {
        try {
          // Generate a unique filename while preserving the extension
          const fileExtension = fileData.name.split('.').pop();
          const uniqueFileName = `${uuidv4()}.${fileExtension}`;
          const storageLocation = `${data.orgId}/note-docs/${uniqueFileName}`;

          // Convert base64 to file
          const base64Data = fileData.content.split(';base64,').pop();
          const fileBuffer = Buffer.from(base64Data, 'base64');

          // Upload to Supabase
          const { error } = await supabase.storage
            .from('note-docs')
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
          const fileRecord = await prisma.tab_files.create({
            data: {
              uid: fileUid,
              orgid: data.orgId,
              tab_notes_id: noteUid,
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
      uid: newNote.uid,
      time_stamp: newNote.time_stamp,
      notes: newNote.notes,
      tab_type: newNote.tab_type,
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
