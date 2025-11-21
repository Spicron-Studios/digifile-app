"use client";

import { getConsentText } from "@/app/actions/settings-uploads";
import { logger } from "@/app/lib/foundation";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { ScrollArea } from "./scroll-area";

type ConsentModalProps = {
	isOpen: boolean;
	onClose: () => void;
	consentNumber: number;
	orgId: string;
};

export function ConsentModal({
	isOpen,
	onClose,
	consentNumber,
	orgId,
}: ConsentModalProps) {
	const [content, setContent] = useState<string>("");
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchConsentContent = async () => {
			if (!isOpen) return;

			try {
				setIsLoading(true);
				setError(null);

				const text = await getConsentText(consentNumber);
				setContent(text);
			} catch (error) {
				setError("Failed to load consent document");
				logger.error(
						"app/components/ui/consent-modal.tsx",
						`Error fetching consent content: ${error instanceof Error ? error.message : "Unknown error"}`,
				);
				setError("Failed to load consent document");
			} finally {
				setIsLoading(false);
			}
		};

		fetchConsentContent();
	}, [isOpen, consentNumber, orgId]);

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>Consent Document {consentNumber}</DialogTitle>
				</DialogHeader>
				<ScrollArea className="h-[60vh] w-full p-4">
					{isLoading ? (
						<div className="flex justify-center">Loading...</div>
					) : error ? (
						<div className="text-red-500">{error}</div>
					) : (
						<pre className="whitespace-pre-wrap font-sans">{content}</pre>
					)}
				</ScrollArea>
			</DialogContent>
		</Dialog>
	);
}
