"use client";
import { logger } from "@/app/lib/foundation";

import { Button } from "@/app/components/ui/button";
import { LogOut, User } from "lucide-react";
import type { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

interface ClientHeaderProps {
	session: Session | null;
}

export function ClientHeader({ session }: ClientHeaderProps) {
	const router = useRouter();

	const handleSignOutClick = async () => {
		try {
			// Call signOut with redirect false to handle navigation manually
			await signOut({
				redirect: false,
				callbackUrl: "/login/signin",
			});

			// Force a hard navigation to signin page
			window.location.href = "/login/signin";
		} catch (error) {
			logger.error(
					"app/components/ui/client-header.tsx",
					`Error signing out: ${error instanceof Error ? error.message : "Unknown error"}`,
				);
			// Fallback navigation if the signOut fails
			router.push("/login/signin");
		}
	};

	return (
		<header className="h-16 border-b bg-white/75 backdrop-blur-sm">
			<div className="flex h-full items-center justify-end px-6 gap-4">
				<div className="flex items-center gap-2">
					<User className="h-4 w-4 text-muted-foreground" />
					<span className="text-sm text-muted-foreground">
						{session?.user?.name || "Guest"}
					</span>
				</div>
				<Button
					variant="ghost"
					size="sm"
					onClick={handleSignOutClick}
					className="gap-2"
				>
					<LogOut className="h-4 w-4" />
					Sign Out
				</Button>
			</div>
		</header>
	);
}
