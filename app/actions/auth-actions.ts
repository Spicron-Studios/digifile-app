"use server";

import { signOut } from "@/app/lib/auth";
import { cookies } from "next/headers";

export async function handleSignOut() {
	// Await the cookies() call
	const cookieStore = await cookies();

	// Clear auth cookies
	cookieStore.delete("next-auth.session-token");
	cookieStore.delete("__Secure-next-auth.session-token");

	// Call the auth signOut function
	await signOut();

	return { success: true };
}
