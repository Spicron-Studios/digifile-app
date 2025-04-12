import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { auth } from '@/app/lib/auth';
import chalk from 'chalk';

export async function GET() {
  try {
    console.log(chalk.blue.bold('🔍 API: /api/files endpoint called'));
    const session = await auth();
    if (!session?.user?.orgId) {
      console.log(chalk.red('❌ API: No organization ID found in session'));
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    console.log(chalk.cyan(`🏢 API: Fetching files for organization ID: ${session.user.orgId}`));

    // Query directly from file_info table - this is the main table
    // All files should be fetched even if there is no associated patient
    const fileInfos = await prisma.file_info.findMany({
      where: { 
        active: true,
        orgid: session.user.orgId 
      },
      include: {
        // Include the relationship to patient through fileinfo_patient
        fileinfo_patient: {
          where: {
            active: true
          },
          include: {
            patient: {
              where: {
                active: true
              }
            }
          }
        }
      },
    });
    
    console.log(chalk.green(`📊 API: Raw query result count: ${fileInfos.length}`));
    
    if (fileInfos.length > 0) {
      const filesWithPatients = fileInfos.filter(f => f.fileinfo_patient.length > 0);
      const filesWithoutPatients = fileInfos.filter(f => f.fileinfo_patient.length === 0);
      
      console.log(chalk.yellow(`📄 API: Files with patients: ${filesWithPatients.length}`));
      console.log(chalk.yellow(`📄 API: Files without patients: ${filesWithoutPatients.length}`));
      
      if (fileInfos.length > 0) {
        console.log(chalk.yellow('📄 API: Sample of first file_info record:'));
        console.log(chalk.yellow(JSON.stringify({
          uid: fileInfos[0].uid,
          file_number: fileInfos[0].file_number,
          account_number: fileInfos[0].account_number,
          has_patient_relations: fileInfos[0].fileinfo_patient.length > 0
        }, null, 2)));
      }
    } else {
      console.log(chalk.yellow('📭 API: No records found'));
    }

    // Transform data to handle cases where patient info might not exist
    const files = fileInfos.map(fileInfo => {
      // Get the first linked patient if it exists
      const filePatient = fileInfo.fileinfo_patient.length > 0 ? fileInfo.fileinfo_patient[0] : null;
      const patient = filePatient?.patient || null;
      
      return {
        uid: fileInfo.uid,
        file_number: fileInfo.file_number || '',
        account_number: fileInfo.account_number || '',
        patient: {
          id: patient?.id || '',
          name: patient?.name || '',
          gender: patient?.gender || '',
        }
      };
    });
    
    console.log(chalk.green(`🔄 API: Transformed response count: ${files.length}`));
    
    if (files.length > 0) {
      const filesWithPatientInfo = files.filter(f => f.patient.id || f.patient.name);
      const filesWithoutPatientInfo = files.filter(f => !f.patient.id && !f.patient.name);
      
      console.log(chalk.magenta(`📋 API: Files with patient info: ${filesWithPatientInfo.length}`));
      console.log(chalk.magenta(`📋 API: Files without patient info: ${filesWithoutPatientInfo.length}`));
      
      if (files.length > 0) {
        console.log(chalk.magenta('📋 API: Sample of first transformed record:'));
        console.log(chalk.magenta(JSON.stringify(files[0], null, 2)));
        
        if (filesWithoutPatientInfo.length > 0) {
          console.log(chalk.magenta('📋 API: Sample of file without patient info:'));
          console.log(chalk.magenta(JSON.stringify(filesWithoutPatientInfo[0], null, 2)));
        }
      }
    } else {
      console.log(chalk.magenta('🚫 API: No records after transform'));
    }

    return NextResponse.json(files);
  } catch (error) {
    console.error(chalk.red('💥 API: Error fetching files:'), error);
    return NextResponse.json({ error: 'Failed to fetch files', files: [] }, { status: 500 });
  }
} 