"use client";

import type { PracticeType } from "@/app/actions/practice-types";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/app/components/ui/select";
import { useState } from "react";

interface PracticeInfoFormProps {
	value: {
		practiceName: string;
		bhfNumber: string;
		hpcsaNumber?: string | undefined;
		practiceType?: string | undefined;
		vatNumber?: string | undefined;
	};
	onChange: (_value: {
		practiceName: string;
		bhfNumber: string;
		hpcsaNumber?: string | undefined;
		practiceType?: string | undefined;
		vatNumber?: string | undefined;
	}) => void;
	errors?: {
		practiceName?: string[];
		bhfNumber?: string[];
	};
	practiceTypes?: PracticeType[];
}

// removed local PracticeType in favor of imported type

export function PracticeInfoForm({
	value,
	onChange,
	errors,
	practiceTypes: initialTypes,
}: PracticeInfoFormProps) {
	const [practiceTypes] = useState<PracticeType[]>(initialTypes ?? []);

	const handleInputChange =
		(field: keyof typeof value) => (e: React.ChangeEvent<HTMLInputElement>) => {
			onChange({
				...value,
				[field]: e.target.value,
			});
		};

	const handleSelectChange =
		(field: keyof typeof value) => (newValue: string) => {
			onChange({
				...value,
				[field]: newValue,
			});
		};

	return (
		<div className="space-y-6 p-4">
			<div className="grid gap-2">
				<Label
					htmlFor="practiceName"
					className="after:content-['*'] after:ml-0.5 after:text-red-500"
				>
					Practice Name
				</Label>
				<Input
					id="practiceName"
					placeholder="Enter practice name"
					value={value.practiceName}
					onChange={handleInputChange("practiceName")}
					required
					aria-invalid={!!errors?.practiceName}
				/>
				{errors?.practiceName && (
					<p className="text-sm text-red-500">
						{errors.practiceName.join(", ")}
					</p>
				)}
			</div>

			<div className="grid gap-2">
				<Label
					htmlFor="bhfNumber"
					className="after:content-['*'] after:ml-0.5 after:text-red-500"
				>
					BHF Number
				</Label>
				<Input
					id="bhfNumber"
					placeholder="Enter BHF number"
					value={value.bhfNumber}
					onChange={(e) => {
						const numbersOnly = e.target.value.replace(/[^0-9]/g, "");
						handleInputChange("bhfNumber")({
							...e,
							target: { ...e.target, value: numbersOnly },
						});
					}}
					required
					aria-invalid={!!errors?.bhfNumber}
				/>
				{errors?.bhfNumber && (
					<p className="text-sm text-red-500">{errors.bhfNumber.join(", ")}</p>
				)}
			</div>

			<div className="grid gap-2">
				<Label htmlFor="hpcsaNumber">HPCSA Number</Label>
				<Input
					id="hpcsaNumber"
					placeholder="Enter HPCSA number"
					value={value.hpcsaNumber || ""}
					onChange={handleInputChange("hpcsaNumber")}
				/>
			</div>

			<div className="grid gap-2">
				<Label htmlFor="practiceType">Practice Type</Label>
				<Select
					value={value.practiceType ?? ""}
					onValueChange={handleSelectChange("practiceType")}
				>
					<SelectTrigger id="practiceType">
						<SelectValue placeholder="Select practice type" />
					</SelectTrigger>
					<SelectContent>
						{practiceTypes.map((type) => (
							<SelectItem key={type.uuid} value={type.uuid}>
								{type.codes} - {type.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="grid gap-2">
				<Label htmlFor="vatNumber">VAT Number</Label>
				<Input
					id="vatNumber"
					placeholder="Enter VAT number"
					value={value.vatNumber || ""}
					onChange={handleInputChange("vatNumber")}
				/>
			</div>
		</div>
	);
}
