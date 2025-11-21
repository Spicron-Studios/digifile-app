"use client";

import { getPatient, updatePatient } from "@/app/actions/patients";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/app/components/ui/select";
import type { PatientWithFiles } from "@/app/types/patient";
import {
	normalizePhoneInput,
	parseSouthAfricanId,
	sanitizeDigits,
	validateDateOfBirth,
	validateEmail,
	validatePhoneNumber,
} from "@/app/utils/helper-functions/sa-id";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function PatientDetailPage(): React.JSX.Element {
	const { uid } = useParams();
	const router = useRouter();
	const [patient, setPatient] = useState<PatientWithFiles | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [validationErrors, setValidationErrors] = useState<{
		id?: string;
		dateOfBirth?: string;
		cellPhone?: string;
		email?: string;
	}>({});

	// Validate and narrow uid to a single string
	const patientUid: string | null = (() => {
		if (!uid) return null;
		if (Array.isArray(uid)) {
			return uid[0] ?? null;
		}
		return typeof uid === "string" ? uid : null;
	})();

	// Redirect if uid is invalid
	useEffect(() => {
		if (!patientUid) {
			router.push("/sites/patients");
		}
	}, [patientUid, router]);

	useEffect(() => {
		async function loadPatient(): Promise<void> {
			if (!patientUid) return;

			try {
				const data = await getPatient(patientUid);
				setPatient(data);
			} catch {
				toast.error("Failed to load patient data");
			} finally {
				setLoading(false);
			}
		}

		void loadPatient();
	}, [patientUid]);

	const handleSave = async (): Promise<void> => {
		if (!patient || !patientUid) return;

		// Validate ID if provided
		if (patient.id) {
			const cleaned = sanitizeDigits(patient.id, 13);
			if (cleaned.length > 0 && cleaned.length !== 13) {
				toast.error("ID number must be exactly 13 digits");
				return;
			}
			if (cleaned.length === 13) {
				const parsed = parseSouthAfricanId(cleaned);
				if (!parsed.valid) {
					toast.error(parsed.reason || "Invalid South African ID number");
					return;
				}
			}
		}

		// Validate date of birth if provided
		if (patient.dateOfBirth) {
			const dobValidation = validateDateOfBirth(patient.dateOfBirth);
			if (!dobValidation.valid) {
				toast.error(dobValidation.error || "Invalid date of birth");
				return;
			}
		}

		// Validate phone if provided
		if (patient.cellPhone) {
			const phoneValidation = validatePhoneNumber(patient.cellPhone);
			if (!phoneValidation.valid) {
				toast.error(phoneValidation.error || "Invalid phone number");
				return;
			}
		}

		// Validate email if provided
		if (patient.email) {
			const emailValidation = validateEmail(patient.email);
			if (!emailValidation.valid) {
				toast.error(emailValidation.error || "Invalid email address");
				return;
			}
		}

		setSaving(true);

		try {
			const result = await updatePatient(patientUid, {
				name: patient.name || "",
				surname: patient.surname || "",
				dateOfBirth: patient.dateOfBirth || "",
				id: patient.id || "",
				title: patient.title || "",
				gender: patient.gender || "",
				cellPhone: patient.cellPhone || "",
				email: patient.email || "",
				address: patient.address || "",
			});

			if (result.success) {
				toast.success("Patient updated successfully");
				if (result.patient) {
					setPatient(result.patient);
				}
			} else {
				toast.error(result.error || "Failed to update patient");
			}
		} catch {
			toast.error("An unexpected error occurred");
		} finally {
			setSaving(false);
		}
	};

	const formatDate = (dateString: string | null | undefined): string => {
		if (!dateString) return "-";
		try {
			const date = new Date(dateString);
			return date.toLocaleDateString();
		} catch {
			return dateString;
		}
	};

	const formatDateForInput = (
		dateString: string | null | undefined,
	): string => {
		if (!dateString) return "";
		try {
			const date = new Date(dateString);
			const isoString = date.toISOString();
			const datePart = isoString.split("T")[0];
			return datePart || "";
		} catch {
			return "";
		}
	};

	if (loading) {
		return (
			<div className="container mx-auto py-8">
				<div className="flex justify-center items-center py-8">
					<p className="text-gray-500">Loading...</p>
				</div>
			</div>
		);
	}

	if (!patient) {
		return (
			<div className="container mx-auto py-8">
				<div className="text-center py-8">
					<p className="text-gray-500">Patient not found</p>
					<Button
						onClick={() => router.push("/sites/patients")}
						className="mt-4"
					>
						Back to Patients
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto py-8">
			<div className="flex justify-between items-center mb-6">
				<div className="flex items-center gap-4">
					<Button
						variant="outline"
						onClick={() => router.push("/sites/patients")}
					>
						← Back
					</Button>
					<h1 className="text-2xl font-bold">
						{patient.name} {patient.surname}
					</h1>
				</div>
				<Button onClick={handleSave} disabled={saving}>
					{saving ? "Saving..." : "Save Changes"}
				</Button>
			</div>

			{/* Patient Details Card */}
			<Card className="p-6 mb-6">
				<h2 className="text-xl font-semibold mb-4">Patient Details</h2>
				<div className="grid grid-cols-2 gap-4">
					<div>
						<Label htmlFor="title">Title</Label>
						<Select
							value={patient.title || ""}
							onValueChange={(value) =>
								setPatient((prev) => (prev ? { ...prev, title: value } : null))
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select title" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="Mr">Mr</SelectItem>
								<SelectItem value="Mrs">Mrs</SelectItem>
								<SelectItem value="Ms">Ms</SelectItem>
								<SelectItem value="Dr">Dr</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div>
						<Label htmlFor="gender">Gender</Label>
						<Select
							value={patient.gender || ""}
							onValueChange={(value) =>
								setPatient((prev) => (prev ? { ...prev, gender: value } : null))
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select gender" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="male">Male</SelectItem>
								<SelectItem value="female">Female</SelectItem>
								<SelectItem value="other">Other</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div>
						<Label htmlFor="name">Name</Label>
						<Input
							id="name"
							value={patient.name || ""}
							onChange={(e) =>
								setPatient((prev) =>
									prev ? { ...prev, name: e.target.value } : null,
								)
							}
						/>
					</div>

					<div>
						<Label htmlFor="surname">Surname</Label>
						<Input
							id="surname"
							value={patient.surname || ""}
							onChange={(e) =>
								setPatient((prev) =>
									prev ? { ...prev, surname: e.target.value } : null,
								)
							}
						/>
					</div>

					<div>
						<Label htmlFor="id">ID Number</Label>
						<Input
							id="id"
							value={patient.id || ""}
							onChange={(e) => {
								const value = e.target.value;
								const cleaned = sanitizeDigits(value, 13);
								setPatient((prev) => (prev ? { ...prev, id: cleaned } : null));

								if (cleaned.length > 0 && cleaned.length !== 13) {
									setValidationErrors((prev) => ({
										...prev,
										id: "ID must be exactly 13 digits",
									}));
								} else if (cleaned.length === 13) {
									const parsed = parseSouthAfricanId(cleaned);
									if (!parsed.valid) {
										setValidationErrors((prev) => ({
											...prev,
											id: parsed.reason || "Invalid South African ID number",
										}));
									} else {
										setValidationErrors((prev) => {
											const { id: _id, ...rest } = prev;
											return rest;
										});
									}
								} else {
									setValidationErrors((prev) => {
										const { id: _id, ...rest } = prev;
										return rest;
									});
								}
							}}
							inputMode="numeric"
							maxLength={13}
							aria-invalid={Boolean(validationErrors.id)}
						/>
						{validationErrors.id && (
							<span className="text-red-500 text-xs mt-1 block">
								{validationErrors.id}
							</span>
						)}
					</div>

					<div>
						<Label htmlFor="dateOfBirth">Date of Birth</Label>
						<Input
							id="dateOfBirth"
							type="date"
							value={formatDateForInput(patient.dateOfBirth)}
							onChange={(e) => {
								const value = e.target.value;
								setPatient((prev) =>
									prev ? { ...prev, dateOfBirth: value } : null,
								);
								const dobValidation = validateDateOfBirth(value);
								if (dobValidation.valid) {
									setValidationErrors((prev) => {
										const { dateOfBirth: _dateOfBirth, ...rest } = prev;
										return rest;
									});
								} else if (dobValidation.error) {
									const errorMsg = dobValidation.error;
									setValidationErrors((prev) => ({
										...prev,
										dateOfBirth: errorMsg,
									}));
								}
							}}
							aria-invalid={Boolean(validationErrors.dateOfBirth)}
						/>
						{validationErrors.dateOfBirth && (
							<span className="text-red-500 text-xs mt-1 block">
								{validationErrors.dateOfBirth}
							</span>
						)}
					</div>

					<div>
						<Label htmlFor="cellPhone">Cell Phone</Label>
						<Input
							id="cellPhone"
							value={patient.cellPhone || ""}
							onChange={(e) => {
								const value = e.target.value;
								const normalized = normalizePhoneInput(value);
								const phoneValidation = validatePhoneNumber(normalized);
								if (phoneValidation.valid) {
									setValidationErrors((prev) => {
										const { cellPhone: _cellPhone, ...rest } = prev;
										return rest;
									});
								} else if (phoneValidation.error) {
									const errorMsg = phoneValidation.error;
									setValidationErrors((prev) => ({
										...prev,
										cellPhone: errorMsg,
									}));
								}
								setPatient((prev) =>
									prev ? { ...prev, cellPhone: normalized } : null,
								);
							}}
							type="tel"
							inputMode="tel"
							aria-invalid={Boolean(validationErrors.cellPhone)}
						/>
						{validationErrors.cellPhone && (
							<span className="text-red-500 text-xs mt-1 block">
								{validationErrors.cellPhone}
							</span>
						)}
					</div>

					<div>
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							value={patient.email || ""}
							onChange={(e) => {
								const value = e.target.value;
								setPatient((prev) => (prev ? { ...prev, email: value } : null));
								const emailValidation = validateEmail(value);
								if (emailValidation.valid) {
									setValidationErrors((prev) => {
										const { email: _email, ...rest } = prev;
										return rest;
									});
								} else if (emailValidation.error) {
									const errorMsg = emailValidation.error;
									setValidationErrors((prev) => ({
										...prev,
										email: errorMsg,
									}));
								}
							}}
							aria-invalid={Boolean(validationErrors.email)}
						/>
						{validationErrors.email && (
							<span className="text-red-500 text-xs mt-1 block">
								{validationErrors.email}
							</span>
						)}
					</div>

					<div className="col-span-2">
						<Label htmlFor="address">Address</Label>
						<Input
							id="address"
							value={patient.address || ""}
							onChange={(e) =>
								setPatient((prev) =>
									prev ? { ...prev, address: e.target.value } : null,
								)
							}
						/>
					</div>
				</div>
			</Card>

			{/* Linked Files Card */}
			<Card className="p-6 mb-6">
				<h2 className="text-xl font-semibold mb-4">Linked Files</h2>
				{patient.files && patient.files.length > 0 ? (
					<div className="bg-white shadow rounded-lg overflow-hidden">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										File Number
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Account Number
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Last Updated
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Actions
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{patient.files.map((file) => (
									<tr key={file.uid} className="hover:bg-gray-50">
										<td className="px-6 py-4 whitespace-nowrap text-sm">
											{file.file_number || "-"}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm">
											{file.account_number || "-"}
										</td>
										<td className="px-6 py-4 whitespace-nowrap text-sm">
											{formatDate(file.lastEdit)}
										</td>
										<td className="px-6 py-4 whitespace-nowrap">
											<Link
												href={`/sites/file-data/${file.uid}`}
												className="text-indigo-600 hover:text-indigo-900"
											>
												View File
											</Link>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				) : (
					<div className="text-center py-8">
						<p className="text-gray-500">No files linked to this patient</p>
					</div>
				)}
			</Card>

			{/* Payment History Card - Under Construction */}
			<Card className="p-6">
				<h2 className="text-xl font-semibold mb-4">Payment History</h2>
				<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
					<div className="flex items-center mb-4">
						<svg
							className="w-6 h-6 text-yellow-600 mr-2"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
							role="img"
							aria-label="Warning icon"
						>
							<title>Warning</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
							/>
						</svg>
						<h3 className="text-lg font-medium text-yellow-800">
							Under Construction
						</h3>
					</div>
					<p className="text-yellow-700 mb-4">
						Payment history functionality is currently being developed. This
						section will display:
					</p>
					<ul className="list-disc list-inside text-yellow-700 space-y-1 mb-4">
						<li>Payment transactions</li>
						<li>Outstanding balances</li>
						<li>Payment methods</li>
						<li>Invoice history</li>
					</ul>
					<div className="bg-white rounded border border-yellow-300 overflow-hidden">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Date
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Description
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Amount
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Status
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								<tr>
									<td
										colSpan={4}
										className="px-6 py-8 text-center text-gray-400 italic"
									>
										No payment data available
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</Card>
		</div>
	);
}
