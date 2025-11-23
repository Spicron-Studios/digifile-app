"use client";

import {
	addAppointment,
	deleteAppointment,
	updateAppointment,
} from "@/app/actions/appointments";
import { getDayEvents } from "@/app/actions/calendar";
import AccountSelector from "@/app/components/ui/account-selector/account-selector";
import AppointmentModal from "@/app/components/ui/appointment/appointment-modal";
import BigCalendar from "@/app/components/ui/big-calendar";
import { Button } from "@/app/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/app/components/ui/card";
import { cn } from "@/app/lib/utils";
import type { Account, CalendarEvent } from "@/app/types/calendar";
import { handleResult } from "@/app/utils/helper-functions/handle-results";
import { getClientLogger } from "@/lib/logger/client";
import type React from "react";
import { useEffect, useMemo, useState } from "react";

export interface CalendarClientProps {
	accounts: Account[];
	events: CalendarEvent[];
}

export default function CalendarClient({
	accounts,
	events,
}: CalendarClientProps): React.JSX.Element {
	const logger = useMemo(() => getClientLogger(), []);

	const [selectedIds, setSelectedIds] = useState<string[]>(() =>
		accounts.map((a) => a.uid),
	);
	const [currentDate, setCurrentDate] = useState<Date>(new Date());
	const [modalOpen, setModalOpen] = useState<boolean>(false);
	const [editing, setEditing] = useState<
		| undefined
		| {
				id?: string;
				userUid?: string;
				date?: string;
				time?: string;
				endTime?: string;
				title?: string;
				description?: string;
		  }
	>(undefined);

	// State to track all events (updated on refresh)
	const [allEvents, setAllEvents] = useState<CalendarEvent[]>(events);
	const [visibleEvents, setVisibleEvents] = useState<CalendarEvent[]>([]);
	const [status, setStatus] = useState<{
		kind: "info" | "warning";
		text: string;
	} | null>(null);

	useEffect(() => {
		let active = true;
		async function load(): Promise<void> {
			await logger.debug(
				"CalendarClient.tsx",
				`refresh useEffect triggered: ${JSON.stringify({ currentDate: currentDate.toISOString(), selectedIds })}`,
			);
			const dayIso = new Date(
				currentDate.getFullYear(),
				currentDate.getMonth(),
				currentDate.getDate(),
			)
				.toISOString()
				.slice(0, 10);

			const { data: dayEvents, error } = await handleResult(
				getDayEvents(dayIso, selectedIds),
			);

			if (error) {
				await logger.error(
					"CalendarClient.tsx",
					`Failed to fetch day events: ${error}`,
				);
				// Fallback to filtering existing events
				const filtered = allEvents.filter(
					(e) =>
						selectedIds.includes(e.resourceId) && sameDay(e.start, currentDate),
				);
				await logger.info(
					"CalendarClient.tsx",
					`Using fallback filtered events: ${filtered.length} events`,
				);
				setVisibleEvents(filtered);
				setStatus({
					kind: "warning",
					text: "Could not refresh events from server. Showing cached results for selected day.",
				});
				return;
			}

			await logger.info(
				"CalendarClient.tsx",
				`getDayEvents returned ${dayEvents.length} events`,
			);
			if (!active) return;

			if (dayEvents.length === 0) {
				const filtered = allEvents.filter(
					(e) =>
						selectedIds.includes(e.resourceId) && sameDay(e.start, currentDate),
				);
				await logger.info(
					"CalendarClient.tsx",
					`Using fallback filtered events: ${filtered.length} events`,
				);
				setVisibleEvents(filtered);
			} else {
				setVisibleEvents(dayEvents);
				setStatus(null);
			}
		}
		void load();
		return () => {
			active = false;
		};
	}, [currentDate, selectedIds, logger, allEvents]);
	const resources = useMemo(
		() =>
			accounts
				.filter((a) => selectedIds.includes(a.uid))
				.map((a) => ({ id: a.uid, title: a.name })),
		[accounts, selectedIds],
	);

	function sameDay(a: Date, b: Date): boolean {
		return (
			a.getFullYear() === b.getFullYear() &&
			a.getMonth() === b.getMonth() &&
			a.getDate() === b.getDate()
		);
	}

	function toLocalISOString(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		const hour = String(date.getHours()).padStart(2, "0");
		const minute = String(date.getMinutes()).padStart(2, "0");
		return `${year}-${month}-${day}T${hour}:${minute}:00`;
	}

	async function onSave(values: {
		id?: string | undefined;
		userUid: string;
		date: string;
		time: string;
		endTime: string;
		title: string;
		description?: string | undefined;
	}): Promise<void> {
		const start = `${values.date}T${values.time}:00`;
		const end = `${values.date}T${values.endTime}:00`;
		if (values.id) {
			await updateAppointment(values.id, {
				userUid: values.userUid,
				title: values.title,
				description: values.description ?? "",
				start,
				end,
			});
		} else {
			await addAppointment({
				userUid: values.userUid,
				title: values.title,
				description: values.description ?? "",
				start,
				end,
			});
		}
		await refreshDay();
	}

	async function onDelete(): Promise<void> {
		if (editing?.id) await deleteAppointment(editing.id);
		await refreshDay();
	}

	async function refreshDay(): Promise<void> {
		// Use local date string to avoid timezone conversion issues
		const year = currentDate.getFullYear();
		const month = String(currentDate.getMonth() + 1).padStart(2, "0");
		const day = String(currentDate.getDate()).padStart(2, "0");
		const dayIso = `${year}-${month}-${day}`;

		await logger.debug(
			"CalendarClient.tsx",
			`Manual refresh triggered: ${JSON.stringify({ dayIso, selectedIds, currentDateDebug: currentDate.toISOString() })}`,
		);
		const dayEvents = await getDayEvents(dayIso, selectedIds);
		await logger.info(
			"CalendarClient.tsx",
			`Manual refresh returned ${dayEvents.length} events`,
		);

		// Apply correct colors to events based on account mapping
		const accountColorMap = new Map(accounts.map((a) => [a.uid, a.color]));
		const dayEventsWithColors = dayEvents.map((e) => ({
			...e,
			color: accountColorMap.get(e.resourceId) ?? e.color,
		}));

		// Split allEvents into current day and other days
		const otherDayEvents = allEvents.filter(
			(e) => !sameDay(e.start, currentDate),
		);

		// Combine: other days + fresh current day events (with correct colors)
		const finalEvents = [...otherDayEvents, ...dayEventsWithColors];

		// UPDATE the allEvents state with merged data
		setAllEvents(finalEvents);

		// Filter to selected IDs and current day for display
		const filtered = dayEventsWithColors.filter((e) =>
			selectedIds.includes(e.resourceId),
		);

		setVisibleEvents(filtered);

		if (dayEvents.length === 0) {
			await logger.info(
				"CalendarClient.tsx",
				`Manual refresh showing: ${filtered.length} events`,
			);
			setStatus({
				kind: "info",
				text: "No events scheduled for the selected day.",
			});
		} else {
			setStatus(null);
		}
	}

	return (
		<div className="flex flex-col gap-3 h-full min-h-0">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
				<Card>
					<CardHeader className="py-2">
						<CardTitle className="text-base">Controls</CardTitle>
					</CardHeader>
					<CardContent className="flex justify-between gap-3">
						<div className="overflow-y-auto pr-2 max-h-[clamp(160px,20vh,240px)]">
							<p className="text-xs text-slate-600 mb-1">Display Doctors:</p>
							<AccountSelector
								accounts={accounts}
								selectedIds={selectedIds}
								onChange={setSelectedIds}
							/>
						</div>
						<div className="flex flex-col items-end gap-2">
							<Button variant="outline" onClick={() => void refreshDay()}>
								Refresh
							</Button>
							<Button variant="secondary" onClick={() => setModalOpen(true)}>
								Book Appointment
							</Button>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="py-2">
						<CardTitle className="text-base">September 2025</CardTitle>
					</CardHeader>
					<CardContent>
						<MiniMonth date={currentDate} onChange={setCurrentDate} />
					</CardContent>
				</Card>
			</div>

			{status ? (
				<div
					className={cn(
						"text-xs px-2 py-1 rounded border",
						status.kind === "warning"
							? "text-amber-700 bg-amber-50 border-amber-200"
							: "text-slate-700 bg-slate-50 border-slate-200",
					)}
				>
					{status.text}
				</div>
			) : null}

			<Card className="flex-1 min-h-0">
				<CardContent className="h-full min-h-0 p-3">
					<BigCalendar
						events={visibleEvents}
						resources={resources}
						_date={currentDate}
						onNavigate={setCurrentDate}
						// Drag-n-drop updates
						onEventDrop={async ({ event, start, end, resourceId }) => {
							const startDate = start as Date;
							const endDate = end as Date;
							await logger.info(
								"CalendarClient.tsx",
								`Event dropped: id=${event.id}, start=${toLocalISOString(startDate)}, end=${toLocalISOString(endDate)}, resourceId=${resourceId}`,
							);
							await updateAppointment(event.id, {
								userUid: (resourceId as string) ?? event.resourceId,
								title: event.title,
								description: event.description ?? "",
								start: toLocalISOString(startDate),
								end: toLocalISOString(endDate),
							});
							await logger.info(
								"CalendarClient.tsx",
								"Event drop update completed",
							);
							await refreshDay();
						}}
						onEventResize={async ({ event, start, end }) => {
							const startDate = start as Date;
							const endDate = end as Date;
							await logger.info(
								"CalendarClient.tsx",
								`Event resized: id=${event.id}, start=${toLocalISOString(startDate)}, end=${toLocalISOString(endDate)}`,
							);
							await updateAppointment(event.id, {
								userUid: event.resourceId,
								title: event.title,
								description: event.description ?? "",
								start: toLocalISOString(startDate),
								end: toLocalISOString(endDate),
							});
							await logger.info(
								"CalendarClient.tsx",
								"Event resize update completed",
							);
							await refreshDay();
						}}
						onSelectEvent={(e) => {
							const editData: typeof editing = {
								id: e.id,
								userUid: e.resourceId,
								date: e.start.toISOString().slice(0, 10),
								time: `${String(e.start.getHours()).padStart(2, "0")}:${String(e.start.getMinutes()).padStart(2, "0")}`,
								endTime: `${String(e.end.getHours()).padStart(2, "0")}:${String(e.end.getMinutes()).padStart(2, "0")}`,
								title: e.title,
							};
							if (e.description) {
								editData.description = e.description;
							}
							setEditing(editData);
						}}
						onSelectSlot={(slot) => {
							const [firstSelectedId] = selectedIds;
							if (!firstSelectedId) return;
							setEditing({
								userUid: firstSelectedId,
								date: slot.start.toISOString().slice(0, 10),
								time: `${String(slot.start.getHours()).padStart(2, "0")}:00`,
								endTime: `${String(slot.end.getHours()).padStart(2, "0")}:00`,
							});
						}}
					/>
				</CardContent>
			</Card>

			<AppointmentModal
				open={modalOpen || editing !== undefined}
				accounts={accounts}
				defaultDate={currentDate}
				initialValues={editing ?? {}}
				onOpenChange={(o) => {
					if (!o) {
						setModalOpen(false);
						setEditing(undefined);
					} else {
						setModalOpen(true);
					}
				}}
				onSave={onSave}
				onDelete={onDelete}
			/>
		</div>
	);
}

function MiniMonth({
	date,
	onChange,
}: {
	date: Date;
	onChange: (_d: Date) => void;
}): React.JSX.Element {
	const month = date.getMonth();
	const year = date.getFullYear();
	const first = new Date(year, month, 1);
	const startWeekday = first.getDay();
	const daysInMonth = new Date(year, month + 1, 0).getDate();
	const days: Array<{
		id: string;
		d: Date;
		label: string;
		isToday: boolean;
		isSelected: boolean;
	}> = [];

	for (let i = 0; i < startWeekday; i++) {
		days.push({
			id: `pad-${year}-${month}-${i}`,
			d: new Date(Number.NaN),
			label: "",
			isToday: false,
			isSelected: false,
		});
	}

	for (let day = 1; day <= daysInMonth; day++) {
		const d = new Date(year, month, day);
		days.push({
			id: `day-${year}-${month}-${day}`,
			d,
			label: String(day),
			isToday: same(d, new Date()),
			isSelected: same(d, date),
		});
	}

	function same(a: Date, b: Date): boolean {
		return a.toDateString() === b.toDateString();
	}

	return (
		<div className="flex flex-col h-full">
			<div className="flex items-center justify-between mb-2">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => onChange(new Date(year, month - 1, 1))}
				>
					{"<"}
				</Button>
				<div className="text-sm font-semibold">
					{date.toLocaleString("default", { month: "long" })} {year}
				</div>
				<Button
					variant="ghost"
					size="sm"
					onClick={() => onChange(new Date(year, month + 1, 1))}
				>
					{">"}
				</Button>
			</div>
			<div className="grid grid-cols-7 text-center text-[10px] font-semibold text-gray-500 mb-1">
				<div>S</div>
				<div>M</div>
				<div>T</div>
				<div>W</div>
				<div>T</div>
				<div>F</div>
				<div>S</div>
			</div>
			<div className="grid grid-cols-7 gap-1">
				{days.map((day) => (
					<button
						key={day.id}
						type="button"
						className={cn(
							"p-2 text-center text-xs rounded-md h-8",
							day.isSelected
								? "bg-indigo-600 text-white"
								: day.isToday
									? "bg-indigo-200"
									: "hover:bg-gray-100",
						)}
						onClick={() => {
							if (!Number.isNaN(day.d.getTime())) onChange(day.d);
						}}
					>
						{day.label}
					</button>
				))}
			</div>
		</div>
	);
}
