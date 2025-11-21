"use client";

import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import type React from "react";

type Injury = {
	company_name?: string;
	contact_person?: string;
	contact_number?: string;
	contact_email?: string;
};

type Props = {
	injury: Injury | undefined;
	onChange: (_field: keyof Injury, _value: string) => void;
	errors?: {
		contact_number?: string;
		contact_email?: string;
	};
};

export default function InjuryOnDutyForm({
	injury,
	onChange,
	errors,
}: Props): React.JSX.Element {
	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<Label htmlFor="company-name">Name of Company</Label>
				<Input
					id="company-name"
					placeholder="Enter company name"
					value={injury?.company_name || ""}
					onChange={(e) => onChange("company_name", e.target.value)}
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="contact-person">Contact Person</Label>
				<Input
					id="contact-person"
					placeholder="Enter contact person name"
					value={injury?.contact_person || ""}
					onChange={(e) => onChange("contact_person", e.target.value)}
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="contact-number">Contact Number</Label>
				<Input
					id="contact-number"
					placeholder="Enter contact number"
					value={injury?.contact_number || ""}
					type="tel"
					inputMode="tel"
					aria-invalid={Boolean(errors?.contact_number)}
					aria-describedby={
						errors?.contact_number ? "contact-number-error" : undefined
					}
					onChange={(e) => onChange("contact_number", e.target.value)}
				/>
				{errors?.contact_number && (
					<span id="contact-number-error" className="text-red-500 text-xs">
						{errors.contact_number}
					</span>
				)}
			</div>

			<div className="space-y-2">
				<Label htmlFor="contact-email">Contact Email</Label>
				<Input
					id="contact-email"
					type="email"
					placeholder="Enter contact email"
					aria-invalid={Boolean(errors?.contact_email)}
					aria-describedby={
						errors?.contact_email ? "contact-email-error" : undefined
					}
					onChange={(e) => onChange("contact_email", e.target.value)}
				/>
				{errors?.contact_email && (
					<span id="contact-email-error" className="text-red-500 text-xs">
						{errors.contact_email}
					</span>
				)}
			</div>
		</div>
	);
}
