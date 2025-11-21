"use client";
import { logger } from "@/app/lib/foundation";

import { Button } from "@/app/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { AuthSkeleton } from "@/app/components/ui/skeletons";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function SigninPage() {
	const router = useRouter();
	const [showForgotPassword, setShowForgotPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [formData, setFormData] = useState({
		bhfNumber: "",
		username: "",
		password: "",
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			//debugger;
			const result = await signIn("credentials", {
				bhfNumber: formData.bhfNumber,
				username: formData.username,
				password: formData.password,
				redirect: false,
			});

			if (result?.error) {
				toast.error("Invalid username, BFH number, or password");
			} else {
				router.push("/sites");
				router.refresh();
			}
		} catch (error) {
			logger.error(
				"app/(auth)/login/signin/page.tsx",
				`Sign in exception: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
			toast.error("An error occurred during sign in");
		} finally {
			setIsLoading(false);
		}
	};

	if (isLoading) {
		return <AuthSkeleton />;
	}

	return (
		<div className="container mx-auto max-w-md mt-20 p-6">
			{/* Logo */}
			<Link href="/" className="block mb-12 text-3xl font-bold">
				<span className="text-blue-600">Digi</span>File
			</Link>

			{/* Sign In Form */}
			<form onSubmit={handleSubmit} className="space-y-6">
				<Input
					placeholder="BFH Number"
					value={formData.bhfNumber}
					onChange={(e) =>
						setFormData((prev) => ({ ...prev, bhfNumber: e.target.value }))
					}
					disabled={isLoading}
					required
				/>

				<Input
					placeholder="Username"
					value={formData.username}
					onChange={(e) =>
						setFormData((prev) => ({ ...prev, username: e.target.value }))
					}
					disabled={isLoading}
					required
				/>

				<Input
					type="password"
					placeholder="Password"
					value={formData.password}
					onChange={(e) =>
						setFormData((prev) => ({ ...prev, password: e.target.value }))
					}
					disabled={isLoading}
					required
				/>

				<Button type="submit" className="w-full" disabled={isLoading}>
					{isLoading ? "Signing in..." : "Login"}
				</Button>
			</form>

			{/* Links */}
			<div className="mt-6 flex justify-between text-sm">
				<Link
					href="/login/registration"
					className="text-green-600 hover:underline"
				>
					Register
				</Link>
				<button
					type="button"
					onClick={() => setShowForgotPassword(true)}
					className="text-purple-600 hover:underline"
				>
					Forgot Password
				</button>
			</div>

			{/* Forgot Password Modal */}
			<Dialog open={showForgotPassword} onOpenChange={setShowForgotPassword}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Reset Password</DialogTitle>
					</DialogHeader>
					{/* TODO: Implement forgot password form */}
				</DialogContent>
			</Dialog>
		</div>
	);
}
