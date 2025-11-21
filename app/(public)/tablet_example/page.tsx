"use client";

import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/app/components/ui/card";
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
import { useRef, useState } from "react";

type DateParts = { year: string; month: string; day: string };

export default function TabletExamplePage(): React.JSX.Element {
	const [patient, setPatient] = useState({
		id: "",
		name: "",
		surname: "",
		gender: "",
		cell_phone: "",
		address: "",
		dob: "",
	});
	const [dobParts, setDobParts] = useState<DateParts>({
		year: "",
		month: "",
		day: "",
	});

	const yearRef = useRef<HTMLInputElement>(null);
	const monthRef = useRef<HTMLInputElement>(null);
	const dayRef = useRef<HTMLInputElement>(null);

	function isLeapYear(year: number): boolean {
		return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
	}

	function daysInMonth(year: number, month: number): number {
		const daysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
		if (month === 2 && isLeapYear(year)) {
			return 29;
		}
		return daysPerMonth[month - 1] ?? 31;
	}

	function isValidYear(year: number): boolean {
		const currentYear = new Date().getFullYear();
		return year >= 1900 && year <= currentYear;
	}

	function onInput(field: keyof typeof patient, value: string): void {
		setPatient((prev) => ({ ...prev, [field]: value }));
	}

	function onGenderChange(value: string): void {
		setPatient((prev) => ({ ...prev, gender: value }));
	}

	function onDobPartChange(
		part: "year" | "month" | "day",
		value: string,
		maxLen: number,
		next?: React.RefObject<HTMLInputElement | null>,
	): void {
		// Only accept digits
		if (!/^\d*$/.test(value)) return;

		let normalizedValue = value;

		// Handle month validation
		if (part === "month") {
			if (value === "00") {
				normalizedValue = "01";
			} else if (value.length === 2) {
				const month = Number.parseInt(value, 10);
				if (month < 1) {
					normalizedValue = "01";
				} else if (month > 12) {
					normalizedValue = "12";
				} else {
					normalizedValue = value.padStart(2, "0");
				}
			}
		}

		// Handle day validation (needs month and year context)
		if (part === "day") {
			if (value === "00") {
				normalizedValue = "01";
			} else if (value.length === 2) {
				const day = Number.parseInt(value, 10);
				const currentMonth = dobParts.month
					? Number.parseInt(dobParts.month, 10)
					: null;
				const currentYear = dobParts.year
					? Number.parseInt(dobParts.year, 10)
					: null;

				if (day < 1) {
					normalizedValue = "01";
				} else if (
					currentMonth !== null &&
					currentYear !== null &&
					isValidYear(currentYear) &&
					currentMonth >= 1 &&
					currentMonth <= 12
				) {
					const maxDay = daysInMonth(currentYear, currentMonth);
					if (day > maxDay) {
						normalizedValue = maxDay.toString().padStart(2, "0");
					} else {
						normalizedValue = value.padStart(2, "0");
					}
				} else if (day > 31) {
					normalizedValue = "31";
				} else {
					normalizedValue = value.padStart(2, "0");
				}
			}
		}

		// Handle year validation
		if (part === "year") {
			if (value.length === 4) {
				const year = Number.parseInt(value, 10);
				if (!isValidYear(year)) {
					// Clamp to valid range
					const currentYear = new Date().getFullYear();
					if (year < 1900) {
						normalizedValue = "1900";
					} else if (year > currentYear) {
						normalizedValue = currentYear.toString();
					}
				}
			}
		}

		// Update the part
		const updatedParts: DateParts = {
			...dobParts,
			[part]: normalizedValue,
		};

		// Revalidate day if month or year changed
		if (
			(part === "month" || part === "year") &&
			updatedParts.day.length === 2
		) {
			const day = Number.parseInt(updatedParts.day, 10);
			const month = updatedParts.month
				? Number.parseInt(updatedParts.month, 10)
				: null;
			const year =
				updatedParts.year.length === 4
					? Number.parseInt(updatedParts.year, 10)
					: null;

			if (
				month !== null &&
				year !== null &&
				isValidYear(year) &&
				month >= 1 &&
				month <= 12
			) {
				const maxDay = daysInMonth(year, month);
				if (day > maxDay) {
					updatedParts.day = maxDay.toString().padStart(2, "0");
				}
			}
		}

		setDobParts(updatedParts);

		// Only compose DOB when all parts are present and valid
		let newDob = "";
		if (
			updatedParts.year.length === 4 &&
			updatedParts.month.length === 2 &&
			updatedParts.day.length === 2
		) {
			const year = Number.parseInt(updatedParts.year, 10);
			const month = Number.parseInt(updatedParts.month, 10);
			const day = Number.parseInt(updatedParts.day, 10);

			if (
				isValidYear(year) &&
				month >= 1 &&
				month <= 12 &&
				day >= 1 &&
				day <= daysInMonth(year, month)
			) {
				newDob = `${updatedParts.year}/${updatedParts.month}/${updatedParts.day}`;
			}
		}

		setPatient((prev) => ({ ...prev, dob: newDob }));

		// Auto-focus only after accepting valid segment length
		if (
			normalizedValue.length === maxLen &&
			next?.current &&
			(part !== "year" || normalizedValue.length === 4)
		) {
			next.current.focus();
		}
	}

	function onSubmit(e: React.FormEvent): void {
		e.preventDefault();
		// Demo submit: log values
		// In real flow, call an action to save the details
		// eslint-disable-next-line no-console
		console.log("Patient Demo Details:", patient);
	}

	return (
		<div className="min-h-screen bg-blue-50 flex items-center justify-center p-4">
			<Card className="w-full max-w-2xl bg-white">
				<CardHeader>
					<CardTitle className="text-blue-700">
						Patient Details (Demo)
					</CardTitle>
				</CardHeader>
				<CardContent>
					<form className="space-y-6" onSubmit={onSubmit}>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							<div className="space-y-2">
								<Label htmlFor="id">Patient ID</Label>
								<Input
									id="id"
									placeholder="Enter ID number"
									value={patient.id}
									onChange={(e) => onInput("id", e.target.value)}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="name">Name</Label>
								<Input
									id="name"
									placeholder="Enter name"
									value={patient.name}
									onChange={(e) => onInput("name", e.target.value)}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="surname">Surname</Label>
								<Input
									id="surname"
									placeholder="Enter surname"
									value={patient.surname}
									onChange={(e) => onInput("surname", e.target.value)}
								/>
							</div>

							<div className="space-y-2">
								<Label>Date of Birth</Label>
								<div className="flex items-center">
									<div className="flex-1">
										<Input
											id="dob-year"
											ref={yearRef}
											placeholder="YYYY"
											maxLength={4}
											className="text-center"
											value={dobParts.year}
											onChange={(e) =>
												onDobPartChange("year", e.target.value, 4, monthRef)
											}
										/>
									</div>
									<span className="px-2 text-blue-400">/</span>
									<div className="w-20">
										<Input
											id="dob-month"
											ref={monthRef}
											placeholder="MM"
											maxLength={2}
											className="text-center"
											value={dobParts.month}
											onChange={(e) =>
												onDobPartChange("month", e.target.value, 2, dayRef)
											}
										/>
									</div>
									<span className="px-2 text-blue-400">/</span>
									<div className="w-20">
										<Input
											id="dob-day"
											ref={dayRef}
											placeholder="DD"
											maxLength={2}
											className="text-center"
											value={dobParts.day}
											onChange={(e) =>
												onDobPartChange("day", e.target.value, 2)
											}
										/>
									</div>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="gender">Gender</Label>
								<Select value={patient.gender} onValueChange={onGenderChange}>
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
								<Label htmlFor="phone">Phone</Label>
								<Input
									id="phone"
									placeholder="Enter phone number"
									value={patient.cell_phone}
									onChange={(e) => onInput("cell_phone", e.target.value)}
								/>
							</div>

							<div className="space-y-2 md:col-span-2">
								<Label htmlFor="address">Residential Address</Label>
								<Input
									id="address"
									placeholder="Enter address"
									value={patient.address}
									onChange={(e) => onInput("address", e.target.value)}
								/>
							</div>
						</div>

						<div className="flex justify-end">
							<button
								type="submit"
								className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
							>
								Save Demo
							</button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
