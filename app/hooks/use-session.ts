"use client";
import { logger } from "@/app/lib/foundation";

import { getSessionData } from "@/app/actions/auth";
import { config } from "@/app/lib/config";
import type { Session } from "next-auth";
import { useEffect, useState } from "react";

export const useSession = () => {
	const [session, setSession] = useState<Session | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const loadSession = async () => {
			try {
				const data = await getSessionData();

				if (!data) {
					setSession(null);
					return;
				}

				const sessionData: Session | null = {
					expires: new Date(Date.now() + config.sessionTimeout).toISOString(),
					user: {
						id: "current-user", // TODO: Get actual user ID from auth data
						orgId: data.user.orgId,
						role: data.user.role ?? null,
						name: data.user.name || null,
						email: data.user.email || null,
					},
				};
				setSession(sessionData);
			} catch (error) {
				logger.error(
					"app/hooks/use-session.ts",
					`Error loading session: ${error instanceof Error ? error.message : "Unknown error"}`,
				);
				setSession(null);
			} finally {
				setIsLoading(false);
			}
		};

		loadSession();
	}, []);

	return {
		session,
		isLoading,
	};
};
