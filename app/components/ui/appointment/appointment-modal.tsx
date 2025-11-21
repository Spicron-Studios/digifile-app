"use client";

import { Button } from "@/app/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/app/components/ui/select";
import { Textarea } from "@/app/components/ui/textarea";
import type { Account } from "@/app/types/calendar";
import { zodResolver } from "@hookform/resolvers/zod";
import type React from "react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const FormSchema = z.object({
	id: z.string().optional(),
	userUid: z.string(),
	date: z.string(), // YYYY-MM-DD
	time: z.string(), // HH:mm
	endTime: z.string(), // HH:mm
	title: z.string().min(1),
	description: z.string().optional(),
});

export interface AppointmentModalProps {
	open: boolean;
	accounts: Account[];
	defaultDate: Date;
	initialValues?: Partial<z.infer<typeof FormSchema>>;
	onOpenChange: (_open: boolean) => void;
	onSave: (_values: z.infer<typeof FormSchema>) => Promise<void> | void;
	onDelete?: () => Promise<void> | void;
}

export default function AppointmentModal(
	props: AppointmentModalProps,
): React.JSX.Element {
	const {
		open,
		accounts,
		defaultDate,
		initialValues,
		onOpenChange,
		onSave,
		onDelete,
	} = props;
	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			userUid: accounts[0]?.uid ?? "",
			date: defaultDate.toISOString().slice(0, 10),
			time: "09:00",
			endTime: "10:00",
			title: "",
			description: "",
		},
	});

	useEffect(() => {
		if (!open) return;
		if (initialValues) {
			form.reset({
				userUid: initialValues.userUid ?? accounts[0]?.uid ?? "",
				date: initialValues.date ?? defaultDate.toISOString().slice(0, 10),
				time: initialValues.time ?? "09:00",
				endTime: initialValues.endTime ?? "10:00",
				title: initialValues.title ?? "",
				description: initialValues.description ?? "",
				id: initialValues.id,
			});
		}
	}, [open, initialValues, accounts, defaultDate, form]);

	function buildTimeOptions(): Array<{ value: string; label: string }> {
		const options: Array<{ value: string; label: string }> = [];
		const startMinutes: number = 5 * 60; // 05:00
		const endMinutes: number = 20 * 60; // 20:00
		for (let m = startMinutes; m <= endMinutes; m += 15) {
			const hours24: number = Math.floor(m / 60);
			const minutes: number = m % 60;
			const value: string = `${String(hours24).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
			const hours12: number = ((hours24 + 11) % 12) + 1;
			const suffix: string = hours24 < 12 ? "am" : "pm";
			const label: string = `${hours12}:${String(minutes).padStart(2, "0")}${suffix}`;
			options.push({ value, label });
		}
		return options;
	}

	const timeOptions = buildTimeOptions();

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{form.getValues("id") ? "Edit Appointment" : "Book Appointment"}
					</DialogTitle>
				</DialogHeader>
				<form
					className="space-y-3"
					onSubmit={form.handleSubmit(async (values) => {
						await onSave(values);
						onOpenChange(false);
					})}
				>
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label htmlFor="appointment-date" className="text-xs font-medium">
								Date
							</label>
							<Input
								id="appointment-date"
								type="date"
								{...form.register("date")}
							/>
						</div>
						<div>
							<div className="text-xs font-medium mb-1">Doctor</div>
							<Select
								value={form.watch("userUid")}
								onValueChange={(v) => form.setValue("userUid", v)}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select doctor" />
								</SelectTrigger>
								<SelectContent>
									{accounts.map((a) => (
										<SelectItem key={a.uid} value={a.uid}>
											{a.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<div className="text-xs font-medium mb-1">Start</div>
							<Select
								value={form.watch("time")}
								onValueChange={(v) => form.setValue("time", v)}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select time" />
								</SelectTrigger>
								<SelectContent className="max-h-80">
									{timeOptions.map((opt) => (
										<SelectItem key={opt.value} value={opt.value}>
											{opt.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div>
							<div className="text-xs font-medium mb-1">End</div>
							<Select
								value={form.watch("endTime")}
								onValueChange={(v) => form.setValue("endTime", v)}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select time" />
								</SelectTrigger>
								<SelectContent className="max-h-80">
									{timeOptions.map((opt) => (
										<SelectItem key={opt.value} value={opt.value}>
											{opt.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>
					<div>
						<label htmlFor="appointment-title" className="text-xs font-medium">
							Title
						</label>
						<Input id="appointment-title" {...form.register("title")} />
					</div>
					<div>
						<label
							htmlFor="appointment-description"
							className="text-xs font-medium"
						>
							Description
						</label>
						<Textarea
							id="appointment-description"
							rows={3}
							{...form.register("description")}
						/>
					</div>
					<div className="flex justify-between pt-2">
						{form.getValues("id") ? (
							<Button
								type="button"
								variant="destructive"
								onClick={async () => {
									await onDelete?.();
									onOpenChange(false);
								}}
							>
								Delete
							</Button>
						) : (
							<span />
						)}
						<Button type="submit">Save</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
