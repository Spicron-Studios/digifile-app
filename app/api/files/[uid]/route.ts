import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/lib/auth';
import chalk from 'chalk';
import { handleGetFileData } from './db_read';
import { handleUpdateFile, handleCreateFile } from './db_write';

// GET a single file by uid
export async function GET(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    console.log(chalk.blue.bold(`🔍 API: /api/files/${params.uid} GET called`));
    const session = await auth();
    if (!session?.user?.orgId) {
      console.log(chalk.red('❌ API: No organization ID found in session'));
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await handleGetFileData(params.uid, session.user.orgId);
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error(chalk.red('💥 API: Error in GET route:'), error);
    return NextResponse.json({ error: 'Failed to fetch file' }, { status: 500 });
  }
}

// PUT endpoint for updating an existing file
export async function PUT(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    console.log(chalk.blue.bold(`🔍 API: /api/files/${params.uid} PUT called`));
    const session = await auth();
    if (!session?.user?.orgId) {
      console.log(chalk.red('❌ API: No organization ID found in session'));
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    
    const result = await handleUpdateFile(params.uid, data, session.user.orgId);
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error(chalk.red('💥 API: Error in PUT route:'), error);
    return NextResponse.json({ error: 'Failed to update file' }, { status: 500 });
  }
}

// POST endpoint for creating a new file
export async function POST(
  request: NextRequest,
  { params }: { params: { uid: string } }
) {
  try {
    console.log(chalk.blue.bold(`🔍 API: /api/files/new POST called`));
    const session = await auth();
    if (!session?.user?.orgId) {
      console.log(chalk.red('❌ API: No organization ID found in session'));
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json();
    
    const result = await handleCreateFile(data, session.user.orgId);
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    
    return NextResponse.json(result.data);
  } catch (error) {
    console.error(chalk.red('💥 API: Error in POST route:'), error);
    return NextResponse.json({ error: 'Failed to create new file' }, { status: 500 });
  }
}
