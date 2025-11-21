import { Toaster } from "sonner";
import "./globals.css";
import { AuthProvider } from "@/app/components/providers/AuthProvider";

export const metadata = {
	title: "DigiFile",
	description: "",
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body suppressHydrationWarning className="antialiased overflow-hidden">
				<AuthProvider>
					<div className="flex h-screen overflow-hidden">
						<main className="flex-1 overflow-y-auto">{children}</main>
					</div>
					<Toaster position="top-center" />
				</AuthProvider>
			</body>
		</html>
	);
}
