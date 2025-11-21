"use client";

import { Button } from "@/app/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/app/components/ui/dialog";
import { Label } from "@/app/components/ui/label";
import { useRef, useState } from "react";

interface ConsentRowProps {
	number: number;
	content: string | null;
	onUpload: (_file: File) => void;
}

export function ConsentRow({ number, content, onUpload }: ConsentRowProps) {
	const [isOpen, setIsOpen] = useState(false);
	const fileInputRef = useRef<HTMLInputElement | null>(null);

	const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			onUpload(file);
		}
	};

	return (
		<div className="flex items-center gap-4">
			<Label className="w-24">Consent {number}</Label>
			<Dialog open={isOpen} onOpenChange={setIsOpen}>
				<DialogTrigger asChild>
					<Button variant="outline" disabled={!content}>
						View
					</Button>
				</DialogTrigger>
				<DialogContent className="max-w-2xl">
					<DialogHeader>
						<DialogTitle>Consent {number}</DialogTitle>
					</DialogHeader>
					<div className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap">
						{content || "No content uploaded"}
					</div>
				</DialogContent>
			</Dialog>
			<input
				type="file"
				ref={fileInputRef}
				onChange={handleFileUpload}
				accept=".txt,.doc,.docx,.pdf"
				className="hidden"
			/>
			<Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
				Upload
			</Button>
		</div>
	);
}
