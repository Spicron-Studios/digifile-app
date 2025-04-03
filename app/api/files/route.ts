import { NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';

export async function GET() {
  try {
    const filePatients = await prisma.fileinfo_patient.findMany({
      where: { active: true },
      include: {
        file_info: true,
        patient: true,
      },
    });

    // Transform data to match the expected format in the UI
    const files = filePatients.map(fp => ({
      uid: fp.fileid,
      file_number: fp.file_info?.file_number || '',
      account_number: fp.file_info?.account_number || '',
      patient: {
        id: fp.patient?.id || '',
        name: fp.patient?.name || '',
        gender: fp.patient?.gender || '',
      }
    }));

    return NextResponse.json(files);
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
  }
} 