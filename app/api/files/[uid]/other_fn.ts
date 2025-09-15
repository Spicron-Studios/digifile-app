import db, {
  medicalScheme,
  tabNotes,
  tabFiles,
  fileinfoPatient,
  patient,
} from '@/app/lib/drizzle';
import { Logger } from '@/app/lib/logger';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, asc } from 'drizzle-orm';
import {
  DbWriteResponse,
  NoteData,
  TabNoteRecord,
  SmartNoteData,
} from '@/app/types/db-types';

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

        // Convert base64 to file
        const base64Data = fileData.content.split(';base64,').pop();
        if (!base64Data) {
          await logger.error(
            'api/files/[uid]/other_fn.ts',
            `Invalid base64 content for file ${fileData.name}`
          );
          continue;
        }
        const fileBuffer = Buffer.from(base64Data, 'base64');

        // Upload to Supabase
        const { error } = await supabase.storage
          .from('note-docs')
          .upload(storageLocation, fileBuffer, {
            contentType: fileData.type,
          });

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

// Smart note save that ensures a file-patient link exists (creating minimal patient+link if needed)
export async function saveNoteSmart(
  data: SmartNoteData
): Promise<DbWriteResponse<TabNoteRecord>> {
  const logger = Logger.getInstance();
  await logger.init();

  try {
    await logger.info('api/files/[uid]/other_fn.ts', 'Smart note save invoked');

    if (!data.orgId || !data.fileUid) {
      await logger.warning(
        'api/files/[uid]/other_fn.ts',
        'Missing orgId or fileUid in smart note request'
      );
      return { error: 'Missing orgId or fileUid', status: 400 };
    }

    // 1) Try find existing active file-patient link for this file
    const linkRows = await db
      .select({ link: fileinfoPatient, patient })
      .from(fileinfoPatient)
      .leftJoin(patient, eq(fileinfoPatient.patientid, patient.uid))
      .where(
        and(
          eq(fileinfoPatient.fileid, data.fileUid),
          eq(fileinfoPatient.orgid, data.orgId),
          eq(fileinfoPatient.active, true)
        )
      )
      .limit(1);

    let fileInfoPatientId: string | null = null;
    let patientUid: string | null = null;

    if (linkRows.length > 0 && linkRows[0]) {
      fileInfoPatientId = linkRows[0].link.uid;
      patientUid = linkRows[0].patient?.uid ?? null;
    }

    // 2) If no link, we need a patient (via id number) and create the link
    if (!fileInfoPatientId) {
      if (!data.patientIdNumber) {
        await logger.warning(
          'api/files/[uid]/other_fn.ts',
          'No file link and no patientIdNumber supplied'
        );
        return { error: 'Patient ID number is required', status: 400 };
      }

      // Find existing patient by national ID number
      const existingPatients = await db
        .select()
        .from(patient)
        .where(
          and(
            eq(patient.id, data.patientIdNumber),
            eq(patient.orgid, data.orgId),
            eq(patient.active, true)
          )
        )
        .limit(1);

      if (existingPatients.length > 0 && existingPatients[0]) {
        patientUid = existingPatients[0].uid;
      } else {
        // Create a minimal patient
        const newPatientUid = uuidv4();
        await db.insert(patient).values({
          uid: newPatientUid,
          id: data.patientIdNumber,
          title: '',
          name: '',
          initials: '',
          surname: '',
          dateOfBirth: null,
          gender: '',
          cellPhone: '',
          additionalName: '',
          additionalCell: '',
          email: '',
          address: '',
          orgid: data.orgId,
          active: true,
          dateCreated: new Date().toISOString(),
          lastEdit: new Date().toISOString(),
        });
        patientUid = newPatientUid;
        await logger.info(
          'api/files/[uid]/other_fn.ts',
          `Created minimal patient with UID: ${newPatientUid}`
        );
      }

      // Create the file-patient link
      const newLinkUid = uuidv4();
      await db.insert(fileinfoPatient).values({
        uid: newLinkUid,
        fileid: data.fileUid,
        patientid: patientUid!,
        orgid: data.orgId,
        active: true,
        dateCreated: new Date().toISOString(),
        lastEdit: new Date().toISOString(),
      });
      fileInfoPatientId = newLinkUid;

      await logger.info(
        'api/files/[uid]/other_fn.ts',
        `Created file-patient link with UID: ${newLinkUid}`
      );
    }

    // 3) We now have the required IDs to save the note
    const notePayload: NoteData = {
      orgId: data.orgId,
      fileInfoPatientId: fileInfoPatientId as string,
      patientId: (patientUid as string) ?? '',
      timeStamp: data.timeStamp,
      notes: data.notes,
      tabType: data.tabType,
      files: data.files,
    };

    const result = await saveNoteWithFiles(notePayload);
    if (result.error) return result;
    return result;
  } catch (error) {
    await logger.error(
      'api/files/[uid]/other_fn.ts',
      `Error in smart note save: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
    return { error: 'Failed to save note', status: 500 };
  }
}
