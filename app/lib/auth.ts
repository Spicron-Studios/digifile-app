import db, { organizationInfo, users, roles } from "@/app/lib/drizzle";
import { logger, wrapError } from "@/app/lib/foundation";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { and, eq } from "drizzle-orm";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Only keep ExtendedUser interface
interface ExtendedUser {
	orgid: string;
	uid: string;
}

export const {
	handlers: { GET, POST },
	auth,
	signIn,
	signOut,
} = NextAuth({
	adapter: DrizzleAdapter(db),
	session: { strategy: "jwt" },
	pages: {
		signIn: "/login",
	},
	callbacks: {
		async jwt({ token, user: dbUser }) {
			const user = dbUser as ExtendedUser | null;
			if (user) {
				token.id = user.uid;
				token.orgId = user.orgid;

				// Get user role directly from user table
				const userWithRole = await db
					.select({
						uid: users.uid,
						orgid: users.orgid,
						roleId: users.roleId,
						roleName: roles.roleName,
					})
					.from(users)
					.leftJoin(roles, eq(users.roleId, roles.uid))
					.where(and(eq(users.uid, user.uid), eq(users.active, true)))
					.limit(1);

				if (userWithRole.length > 0) {
					const userData = userWithRole[0];
					if (userData && userData.roleId) {
						token.role = {
							uid: userData.roleId,
							name: userData.roleName || "Unknown",
						};
					} else {
						token.role = null;
					}
				} else {
					token.role = null;
				}
			}
			return token;
		},
		async session({ session, token }) {
			return {
				...session,
				user: {
					...session.user,
					id: token.id as string,
					orgId: token.orgId as string,
					role:
						(token as unknown as { role: { uid: string; name: string } | null })
							.role ?? null,
				},
			};
		},
	},
	providers: [
		CredentialsProvider({
			name: "Credentials",
			credentials: {
				bhfNumber: { label: "BFH Number", type: "text" },
				username: { label: "Username", type: "text" },
				password: { label: "Password", type: "password" },
			},
			async authorize(credentials) {
				if (
					!credentials?.bhfNumber ||
					!credentials?.username ||
					!credentials?.password
				) {
					return null;
				}

				try {
					// Find organization using Drizzle
					const orgResults = await db
						.select()
						.from(organizationInfo)
						.where(
							and(
								eq(organizationInfo.bhfNumber, credentials.bhfNumber as string),
								eq(organizationInfo.active, true),
							),
						)
						.limit(1);

					if (orgResults.length === 0) return null;
					const org = orgResults[0];
					if (!org) return null;

					// Find user using Drizzle
					const userResults = await db
						.select()
						.from(users)
						.where(
							and(
								eq(users.username, credentials.username as string),
								eq(users.orgid, org.uid),
								eq(users.active, true),
							),
						)
						.limit(1);

					if (userResults.length === 0) return null;
					const user = userResults[0];
					if (!user) return null;

					// Direct password comparison (no encryption for now)
					if (user.secretKey !== credentials.password) return null;

					return {
						uid: user.uid,
						name: `${user.firstName || ""} ${user.surname || ""}`.trim(),
						email: user.email || "",
						orgid: user.orgid || "",
					};
				} catch (error) {
					try {
						const wrapped = wrapError(
							error,
							"Auth",
							"Error during authorization",
						);
						logger.error("app/lib/auth.ts", wrapped);
					} catch (loggerError) {
						// Fallback to console.error if logger fails - original error must never be lost
						// eslint-disable-next-line no-console
						console.error(
							"[AUTH ERROR] Authorization failed:",
							error,
							"\nStack:",
							error instanceof Error ? error.stack : "No stack trace available",
							"\nLogger initialization/usage also failed:",
							loggerError instanceof Error
								? loggerError.message
								: "Unknown logger error",
						);
					}
					return null;
				}
			},
		}),
	],
});
