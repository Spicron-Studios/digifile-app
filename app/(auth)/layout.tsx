export const metadata = {
	title: "DigiFile – Auth",
	description: "Authentication pages",
};

import type React from "react";

export default function AuthLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>): React.JSX.Element {
	return (
		<div className="min-h-screen flex items-start justify-center p-6 pt-12">
			{children}
		</div>
	);
}
