"use server";

import { auth } from "@/app/lib/auth";
import { getBucket } from "@/app/lib/storage";
import { getSupabaseClient } from "@/app/lib/supabase";

export async function uploadOrganizationLogo(
	file: File,
): Promise<{ url: string }> {
	const session = await auth();
	if (!session?.user?.orgId) throw new Error("Unauthorized");
	const supabase = getSupabaseClient();
	if (!supabase) throw new Error("Supabase not configured");

	const path = `${session.user.orgId}/logo/${session.user.orgId}-logo.jpg`;
	const { error } = await supabase.storage
		.from(getBucket("ASSETS"))
		.upload(path, file, { upsert: true, contentType: "image/jpeg" });
	if (error) throw new Error("Failed to upload logo");

	const { data } = supabase.storage
		.from(getBucket("ASSETS"))
		.getPublicUrl(path);
	return { url: data.publicUrl };
}

export async function uploadOrganizationAsset(
	type: "logo" | "consent",
	file: File,
	consentNumber?: number,
): Promise<{ url: string }> {
	const session = await auth();
	if (!session?.user?.orgId) throw new Error("Unauthorized");
	const supabase = getSupabaseClient();
	if (!supabase) throw new Error("Supabase not configured");

	let path = "";
	let contentType = "";
	if (type === "logo") {
		path = `${session.user.orgId}/logo/${session.user.orgId}-logo.jpg`;
		contentType = "image/jpeg";
	} else {
		path = `${session.user.orgId}/consent-forms/${session.user.orgId}Consent${consentNumber}.txt`;
		contentType = "text/plain";
	}

	const { error } = await supabase.storage
		.from(getBucket("ASSETS"))
		.upload(path, file, { upsert: true, contentType });
	if (error) throw new Error("Failed to upload file");

	const { data } = supabase.storage
		.from(getBucket("ASSETS"))
		.getPublicUrl(path);
	return { url: data.publicUrl };
}

export async function getConsentText(consentNumber: number): Promise<string> {
	const session = await auth();
	if (!session?.user?.orgId) throw new Error("Unauthorized");
	const supabase = getSupabaseClient();
	if (!supabase) throw new Error("Supabase not configured");

	const path = `${session.user.orgId}/consent-forms/${session.user.orgId}Consent${consentNumber}.txt`;
	const res = await supabase.storage.from(getBucket("ASSETS")).download(path);
	if (res.error) throw new Error("File not found");
	const text = await res.data.text();
	return text;
}
