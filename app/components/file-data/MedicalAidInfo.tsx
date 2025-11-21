"use client";

import { Checkbox } from "@/app/components/ui/checkbox";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/app/components/ui/select";
import type React from "react";

type MedicalScheme = { uid: string; scheme_name: string };

type Member = {
	id?: string;
	title?: string;
	name?: string;
	initials?: string;
	surname?: string;
	dob?: string;
	gender?: string;
	cell?: string;
};

type Props = {
	medicalSchemes: MedicalScheme[];
	sameAsPatient: boolean;
	member: Member | undefined;
	medicalAid:
		| {
				scheme_id?: string;
				membership_number?: string;
				dependent_code?: string;
		  }
		| undefined;
	onSchemeChange: (_schemeId: string) => void;
	onSameAsPatientChange: (_checked: boolean) => void;
	onMemberInputChange: (_field: string, _value: string) => void;
	onMemberSelectChange: (_field: string, _value: string) => void;
	memberDateParts: { year: string; month: string; day: string };
	onMemberDatePartChange: (
		_part: "year" | "month" | "day",
		_value: string,
		_maxLen: number,
		_next?: React.RefObject<HTMLInputElement | null>,
	) => void;
	memberRefs: {
		yearRef: React.RefObject<HTMLInputElement | null>;
		monthRef: React.RefObject<HTMLInputElement | null>;
		dayRef: React.RefObject<HTMLInputElement | null>;
	};
	onMedicalAidFieldChange: (
		_field: "membership_number" | "dependent_code",
		_value: string,
	) => void;
	errors?: {
		member_id?: string;
		member_cell?: string;
	};
};

export default function MedicalAidInfo({
	medicalSchemes,
	sameAsPatient,
	member,
	medicalAid,
	onSchemeChange,
	onSameAsPatientChange,
	onMemberInputChange,
	onMemberSelectChange,
	memberDateParts,
	onMemberDatePartChange,
	memberRefs,
	onMedicalAidFieldChange,
	errors,
}: Props): React.JSX.Element {
	return (
		<div className="space-y-6">
			<h4 className="text-md font-medium">Medical Aid Details</h4>
			<div className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="medical-aid-name">Medical Aid</Label>
					<Select
						value={medicalAid?.scheme_id || ""}
						onValueChange={onSchemeChange}
					>
						<SelectTrigger>
							<SelectValue placeholder="Select medical aid" />
						</SelectTrigger>
						<SelectContent>
							{medicalSchemes.map((scheme) => (
								<SelectItem key={scheme.uid} value={scheme.uid}>
									{scheme.scheme_name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-2">
					<Label htmlFor="membership-number">Membership Number</Label>
					<Input
						id="membership-number"
						placeholder="Enter membership number"
						value={medicalAid?.membership_number || ""}
						onChange={(e) =>
							onMedicalAidFieldChange("membership_number", e.target.value)
						}
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="dependent-code">Patient Dependent Code</Label>
					<Input
						id="dependent-code"
						placeholder="Enter dependent code"
						value={medicalAid?.dependent_code || ""}
						onChange={(e) =>
							onMedicalAidFieldChange("dependent_code", e.target.value)
						}
					/>
				</div>
			</div>

			<div className="pt-4 border-t">
				<h4 className="text-md font-medium mb-4">Main Member</h4>
				<div className="flex items-center space-x-2 mb-4">
					<Checkbox
						id="same-as-patient"
						checked={sameAsPatient}
						onCheckedChange={(v) => onSameAsPatientChange(Boolean(v))}
					/>
					<Label htmlFor="same-as-patient">Same as patient</Label>
				</div>

				{!sameAsPatient && (
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="member-id">ID Number</Label>
							<Input
								id="member-id"
								placeholder="Enter ID number"
								value={member?.id || ""}
								inputMode="numeric"
								maxLength={13}
								aria-invalid={Boolean(errors?.member_id)}
								onChange={(e) => onMemberInputChange("id", e.target.value)}
							/>
							{errors?.member_id && (
								<span className="text-red-500 text-xs">{errors.member_id}</span>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="member-title">Title</Label>
							<Select
								value={member?.title || ""}
								onValueChange={(value) => onMemberSelectChange("title", value)}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select title" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="Mr">Mr</SelectItem>
									<SelectItem value="Mrs">Mrs</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="member-name">Name</Label>
							<Input
								id="member-name"
								placeholder="Enter name"
								value={member?.name || ""}
								onChange={(e) => onMemberInputChange("name", e.target.value)}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="member-initials">Initials</Label>
							<Input
								id="member-initials"
								placeholder="Auto-generated from name"
								value={member?.initials || ""}
								readOnly
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="member-surname">Surname</Label>
							<Input
								id="member-surname"
								placeholder="Enter surname"
								value={member?.surname || ""}
								onChange={(e) => onMemberInputChange("surname", e.target.value)}
							/>
						</div>

						<div className="space-y-2">
							<Label>Date of Birth</Label>
							<div className="flex items-center">
								<div className="flex-1">
									<Input
										id="member-dob-year"
										ref={memberRefs.yearRef}
										placeholder="YYYY"
										maxLength={4}
										className="text-center"
										value={memberDateParts.year}
										onChange={(e) =>
											onMemberDatePartChange(
												"year",
												e.target.value,
												4,
												memberRefs.monthRef,
											)
										}
									/>
								</div>
								<span className="px-2 text-gray-500">/</span>
								<div className="w-16">
									<Input
										id="member-dob-month"
										ref={memberRefs.monthRef}
										placeholder="MM"
										maxLength={2}
										className="text-center"
										value={memberDateParts.month}
										onChange={(e) =>
											onMemberDatePartChange(
												"month",
												e.target.value,
												2,
												memberRefs.dayRef,
											)
										}
									/>
								</div>
								<span className="px-2 text-gray-500">/</span>
								<div className="w-16">
									<Input
										id="member-dob-day"
										ref={memberRefs.dayRef}
										placeholder="DD"
										maxLength={2}
										className="text-center"
										value={memberDateParts.day}
										onChange={(e) =>
											onMemberDatePartChange("day", e.target.value, 2)
										}
									/>
								</div>
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="member-gender">Gender</Label>
							<Select
								value={member?.gender || ""}
								onValueChange={(value) => onMemberSelectChange("gender", value)}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select gender" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="male">Male</SelectItem>
									<SelectItem value="female">Female</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="member-cell">Cell Number</Label>
							<Input
								id="member-cell"
								placeholder="Enter cell number"
								value={member?.cell || ""}
								type="tel"
								inputMode="tel"
								aria-invalid={Boolean(errors?.member_cell)}
								onChange={(e) => onMemberInputChange("cell", e.target.value)}
							/>
							{errors?.member_cell && (
								<span className="text-red-500 text-xs">
									{errors.member_cell}
								</span>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
