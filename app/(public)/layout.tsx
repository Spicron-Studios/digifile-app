export const metadata = {
	title: "DigiFile – Public",
	description: "Public pages for patients",
};

import type React from "react";

export default function PublicLayout({
	children,
}: Readonly<{ children: React.ReactNode }>): React.JSX.Element {
	return (
		<div className="min-h-screen bg-gray-50">
			<header className="sticky top-0 z-10 bg-white border-b">
				<div className="mx-auto max-w-2xl px-4 py-3">
					<div className="flex items-center justify-between">
						<div className="font-semibold text-sky-600">DigiFile</div>
						<div className="text-xs text-gray-500">Patient Intake</div>
					</div>
				</div>
			</header>
			<main className="mx-auto max-w-2xl px-4 py-6 sm:py-8">{children}</main>
		</div>
	);
}
