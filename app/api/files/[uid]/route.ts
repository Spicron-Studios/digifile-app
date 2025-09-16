import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(
  _request: Request,
  { params }: { params: { uid: string } }
) {
  return NextResponse.json({ message: `Received UID: ${params.uid}` });
}

export async function PUT(
  _request: Request,
  { params }: { params: { uid: string } }
) {
  return NextResponse.json({ message: `Received UID for PUT: ${params.uid}` });
}

export async function POST(_request: Request) {
  return NextResponse.json({ message: 'POST request successful' });
}
