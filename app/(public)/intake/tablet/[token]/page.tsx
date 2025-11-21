"use client";

import {
	normalizePhoneInput,
	parseSouthAfricanId,
	sanitizeDigits,
	validateDateOfBirth,
	validateEmail,
	validatePhoneNumber,
} from "@/app/utils/helper-functions/sa-id";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function TabletIntakePage() {
	const { token } = useParams<{ token: string }>();

	const [form, setForm] = useState({
		name: "",
		surname: "",
		dateOfBirth: "",
		isUnder18: false,
		id: "",
		title: "",
		gender: "",
		cellPhone: "",
		email: "",
		address: "",
	});
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [tokenValid, setTokenValid] = useState<boolean | null>(null);
	const [validationErrors, setValidationErrors] = useState<{
		id?: string;
		dateOfBirth?: string;
		cellPhone?: string;
		email?: string;
	}>({});

	useEffect(() => {
		async function checkToken() {
			setTokenValid(null);
			setError(null);
			try {
				const res = await fetch(`/api/public/intake/${token}`, {
					method: "OPTIONS",
				});
				setTokenValid(res.ok);
			} catch (_err) {
				setTokenValid(false);
			}
		}
		if (token) checkToken();
	}, [token]);

	const handleChange = (key: string, value: string | boolean) => {
		// Handle cellPhone case first: normalize, validate, update state once, then return
		if (key === "cellPhone" && typeof value === "string") {
			const normalized = normalizePhoneInput(value);
			const phoneValidation = validatePhoneNumber(normalized);
			setForm((prev) => ({ ...prev, cellPhone: normalized }));
			setValidationErrors((prev) => {
				const updated = { ...prev };
				if (phoneValidation.valid) {
					updated.cellPhone = undefined;
				} else if (phoneValidation.error) {
					updated.cellPhone = phoneValidation.error;
				}
				return updated;
			});
			return;
		}

		setForm((prev) => ({ ...prev, [key]: value }));

		// Real-time validation
		if (key === "id" && typeof value === "string") {
			const cleaned = sanitizeDigits(value, 13);
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
		}

		if (key === "dateOfBirth" && typeof value === "string") {
			const dobValidation = validateDateOfBirth(value);
			setValidationErrors((prev) => {
				if (dobValidation.valid) {
					const { dateOfBirth: _dateOfBirth, ...rest } = prev;
					return rest;
				}
				return {
					...prev,
					...(dobValidation.error ? { dateOfBirth: dobValidation.error } : {}),
				};
			});
		}

		if (key === "email" && typeof value === "string") {
			const emailValidation = validateEmail(value);
			setValidationErrors((prev) => {
				if (emailValidation.valid) {
					const { email: _email, ...rest } = prev;
					return rest;
				}
				return {
					...prev,
					...(emailValidation.error ? { email: emailValidation.error } : {}),
				};
			});
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setSubmitting(true);
		setError(null);
		setSuccess(null);

		// Validation before submit
		if (!form.name.trim() || !form.dateOfBirth.trim()) {
			setError("Please fill in required fields.");
			setSubmitting(false);
			return;
		}

		if (!form.isUnder18 && (!form.id || form.id.trim() === "")) {
			setError("ID number is required for adults.");
			setSubmitting(false);
			return;
		}

		// Validate ID if provided
		if (!form.isUnder18 && form.id) {
			const cleaned = sanitizeDigits(form.id, 13);
			if (cleaned.length !== 13) {
				setError("ID number must be exactly 13 digits.");
				setSubmitting(false);
				return;
			}
			const parsed = parseSouthAfricanId(cleaned);
			if (!parsed.valid) {
				setError(parsed.reason || "Invalid South African ID number.");
				setSubmitting(false);
				return;
			}
		}

		// Validate date of birth
		const dobValidation = validateDateOfBirth(form.dateOfBirth);
		if (!dobValidation.valid) {
			setError(dobValidation.error || "Invalid date of birth.");
			setSubmitting(false);
			return;
		}

		// Validate phone if provided
		if (form.cellPhone) {
			const phoneValidation = validatePhoneNumber(form.cellPhone);
			if (!phoneValidation.valid) {
				setError(phoneValidation.error || "Invalid phone number.");
				setSubmitting(false);
				return;
			}
		}

		// Validate email if provided
		if (form.email) {
			const emailValidation = validateEmail(form.email);
			if (!emailValidation.valid) {
				setError(emailValidation.error || "Invalid email address.");
				setSubmitting(false);
				return;
			}
		}

		try {
			const res = await fetch(`/api/public/intake/${token}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(form),
			});

			const json = await res.json().catch(() => ({}));
			if (!res.ok) {
				setError(json.error || "Submission failed");
			} else {
				setSuccess("Form submitted successfully.");
				setForm({
					name: "",
					surname: "",
					dateOfBirth: "",
					isUnder18: false,
					id: "",
					title: "",
					gender: "",
					cellPhone: "",
					email: "",
					address: "",
				});
			}
		} catch {
			setError("Network error");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<div style={{ maxWidth: 640, margin: "0 auto", padding: 16 }}>
			<h1>Patient Intake (Tablet)</h1>
			<p>Hand the device to the patient to complete their details.</p>

			{tokenValid === false && (
				<p style={{ color: "red" }}>
					Invalid link. Please request a new tablet link.
				</p>
			)}

			<form onSubmit={handleSubmit}>
				<div>
					<label htmlFor="name">Name*</label>
					<input
						id="name"
						value={form.name}
						onChange={(e) => handleChange("name", e.target.value)}
						required
					/>
				</div>
				<div>
					<label htmlFor="surname">Surname</label>
					<input
						id="surname"
						value={form.surname}
						onChange={(e) => handleChange("surname", e.target.value)}
					/>
				</div>
				<div>
					<label htmlFor="dateOfBirth">Date of Birth* (YYYY-MM-DD)</label>
					<input
						id="dateOfBirth"
						value={form.dateOfBirth}
						onChange={(e) => handleChange("dateOfBirth", e.target.value)}
						placeholder="YYYY-MM-DD"
						required
						type="date"
						style={{
							borderColor: validationErrors.dateOfBirth ? "red" : undefined,
						}}
					/>
					{validationErrors.dateOfBirth && (
						<p style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>
							{validationErrors.dateOfBirth}
						</p>
					)}
				</div>
				<div>
					<label>
						<input
							type="checkbox"
							checked={form.isUnder18}
							onChange={(e) => handleChange("isUnder18", e.target.checked)}
						/>
						Under 18
					</label>
				</div>
				{!form.isUnder18 && (
					<div>
						<label htmlFor="id">ID Number*</label>
						<input
							id="id"
							value={form.id}
							onChange={(e) => handleChange("id", e.target.value)}
							required
							inputMode="numeric"
							maxLength={13}
							style={{ borderColor: validationErrors.id ? "red" : undefined }}
						/>
						{validationErrors.id && (
							<p style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>
								{validationErrors.id}
							</p>
						)}
					</div>
				)}
				<div>
					<label htmlFor="title">Title</label>
					<input
						id="title"
						value={form.title}
						onChange={(e) => handleChange("title", e.target.value)}
					/>
				</div>
				<div>
					<label htmlFor="gender">Gender</label>
					<input
						id="gender"
						value={form.gender}
						onChange={(e) => handleChange("gender", e.target.value)}
					/>
				</div>
				<div>
					<label htmlFor="cellPhone">Cell Phone</label>
					<input
						id="cellPhone"
						value={form.cellPhone}
						onChange={(e) => handleChange("cellPhone", e.target.value)}
						type="tel"
						inputMode="tel"
						style={{
							borderColor: validationErrors.cellPhone ? "red" : undefined,
						}}
					/>
					{validationErrors.cellPhone && (
						<p style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>
							{validationErrors.cellPhone}
						</p>
					)}
				</div>
				<div>
					<label htmlFor="email">Email</label>
					<input
						id="email"
						type="email"
						value={form.email}
						onChange={(e) => handleChange("email", e.target.value)}
						style={{ borderColor: validationErrors.email ? "red" : undefined }}
					/>
					{validationErrors.email && (
						<p style={{ color: "red", fontSize: "12px", marginTop: "4px" }}>
							{validationErrors.email}
						</p>
					)}
				</div>
				<div>
					<label htmlFor="address">Address</label>
					<textarea
						id="address"
						value={form.address}
						onChange={(e) => handleChange("address", e.target.value)}
					/>
				</div>

				<button
					type="submit"
					disabled={submitting || tokenValid === false || tokenValid === null}
				>
					{submitting ? "Submitting…" : "Submit"}
				</button>
			</form>

			{error && <p style={{ color: "red" }}>{error}</p>}
			{success && <p style={{ color: "green" }}>{success}</p>}
		</div>
	);
}
