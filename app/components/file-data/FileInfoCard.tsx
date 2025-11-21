"use client";

import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import type React from "react";

type Props = {
	fileNumber: string;
	accountNumber: string;
	onChange: (_field: "file_number" | "account_number", _value: string) => void;
};

export default function FileInfoCard({
	fileNumber,
	accountNumber,
	onChange,
}: Props): React.JSX.Element {
	return (
		<Card className="p-4 mb-4">
			<div className="grid grid-cols-2 gap-4">
				<div className="space-y-2">
					<Label htmlFor="file-number">File Number</Label>
					<Input
						id="file-number"
						value={fileNumber}
						onChange={(e) => onChange("file_number", e.target.value)}
						placeholder="Enter file number"
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="account-number">Account Number</Label>
					<Input
						id="account-number"
						value={accountNumber}
						onChange={(e) => onChange("account_number", e.target.value)}
						placeholder="Enter account number"
					/>
				</div>
			</div>
		</Card>
	);
}
