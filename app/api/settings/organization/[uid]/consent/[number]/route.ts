import { Logger } from "@/app/lib/logger/logger.service";
export const runtime = "nodejs";
import { auth } from "@/app/lib/auth";
import { getBucket } from "@/app/lib/storage";
import { getSupabaseClient } from "@/app/lib/supabase";
import type { NextRequest } from "next/server";

const logger = Logger.getInstance();
logger.init().catch(() => {
	// Silently fail - logger initialization failed
});

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ uid: string; number: string }> },
): Promise<Response> {
	try {
		const { uid, number } = await params;
		const session = await auth();
		if (!session?.user?.orgId) {
			return new Response("Unauthorized", { status: 401 });
		}

		if (session.user.orgId !== uid) {
			return new Response("Forbidden", { status: 403 });
		}

		const supabase = getSupabaseClient();
		if (!supabase) {
			return new Response("Supabase client not initialized", { status: 500 });
		}

		const path = `${uid}/consent-forms/${uid}Consent${number}.txt`;

		const { data, error } = await supabase.storage
			.from(getBucket("ASSETS"))
			.download(path);

		if (error) {
			try {
				await logger.error(
					"api/settings/organization/[uid]/consent/[number]/route.ts",
					`Error fetching consent file: ${error.message ?? "Unknown error"}`,
				);
			} catch (_logError) {
				// Silently fail - logger failed
			}
			return new Response("File not found", { status: 404 });
		}

		const text = await data.text();
		return new Response(text, {
			headers: { "Content-Type": "text/plain" },
		});
	} catch (error) {
		try {
			await logger.error(
				"api/settings/organization/[uid]/consent/[number]/route.ts",
				`Error processing consent request: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		} catch (_logError) {
			// Silently fail - logger failed
		}
		return new Response("Internal Server Error", { status: 500 });
	}
}
