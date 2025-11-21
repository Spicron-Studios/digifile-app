import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ uid: string }> },
): Promise<NextResponse> {
	const { uid } = await params;
	return NextResponse.json({ message: `Received UID: ${uid}` });
}

export async function PUT(
	_request: Request,
	{ params }: { params: Promise<{ uid: string }> },
): Promise<NextResponse> {
	const { uid } = await params;
	return NextResponse.json({ message: `Received UID for PUT: ${uid}` });
}

export async function POST(_request: Request) {
	return NextResponse.json({ message: "POST request successful" });
}
