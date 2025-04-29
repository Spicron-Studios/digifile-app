import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import prisma from '@/app/lib/prisma';
import chalk from 'chalk';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate the required fields
    if (!data.notes || !data.tabType || !data.timeStamp) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Create a new note in the database
    const noteUid = uuidv4();
    //log data with chalk stringyfy 
    //console.log(chalk.blue(data.orgId));
    console.log(chalk.green(data.fileInfoPatientId));
    //console.log(chalk.green(data.patientId));
    //console.log(chalk.green(data.timeStamp));
    //console.log(chalk.green(data.notes));
    //console.log(chalk.green(data.tabType));
    
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
        last_edit: new Date()
      }
    });
    
    // Handle file uploads
    const fileRecords = [];
    
    if (data.files && data.files.length > 0) {
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
          const { data: uploadData, error } = await supabase.storage
            .from('note-docs')
            .upload(storageLocation, fileBuffer, {
              contentType: fileData.type
            });
            
          if (error) {
            console.error('Supabase storage upload error:', error);
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
              last_edit: new Date()
            }
          });
          
          fileRecords.push({
            uid: fileRecord.uid,
            file_name: fileRecord.file_name,
            file_type: fileRecord.file_type,
            file_location: fileRecord.file_location
          });
        } catch (fileError) {
          console.error('Error processing file:', fileError);
        }
      }
    }
    
    // Return the complete note data with file records
    const completeNote = {
      uid: newNote.uid,
      time_stamp: newNote.time_stamp,
      notes: newNote.notes,
      tab_type: newNote.tab_type,
      files: fileRecords
    };
    
    return NextResponse.json(completeNote, { status: 201 });
    
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
} 