"use client";

import type React from "react";
import { useCallback, useMemo } from "react";
import {
	type CalendarProps,
	Calendar as RBCalendar,
	Views,
	dateFnsLocalizer,
} from "react-big-calendar";
import withDragAndDrop, {
	type EventInteractionArgs,
} from "react-big-calendar/lib/addons/dragAndDrop";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import { format, getDay, parse, startOfWeek } from "date-fns";
import { enZA } from "date-fns/locale/en-ZA";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/app/components/ui/tooltip";
import type { CalendarEvent } from "@/app/types/calendar";

const locales = { "en-ZA": enZA } as const;
const localizer = dateFnsLocalizer({
	format,
	parse,
	startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
	getDay,
	locales,
});

export interface BigCalendarProps {
	events: CalendarEvent[];
	resources: Array<{ id: string; title: string }>;
	_date: Date;
	onNavigate?: (_date: Date) => void;
	onSelectSlot?: (_slotInfo: { start: Date; end: Date }) => void;
	onSelectEvent?: (_event: CalendarEvent) => void;
	// Match library's EventInteractionArgs type
	onEventDrop?: (
		_args: EventInteractionArgs<CalendarEvent>,
	) => void | Promise<void>;
	onEventResize?: (
		_args: EventInteractionArgs<CalendarEvent>,
	) => void | Promise<void>;
	[key: string]: unknown;
}

// Properly type the wrapped calendar component
const DragAndDropCalendar = withDragAndDrop<
	CalendarEvent,
	{ id: string; title: string }
>(
	RBCalendar as React.ComponentType<
		CalendarProps<CalendarEvent, { id: string; title: string }>
	>,
);

export default function BigCalendar(
	props: BigCalendarProps,
): React.JSX.Element {
	const {
		events,
		resources,
		onSelectEvent,
		onSelectSlot,
		_date,
		onNavigate,
		onEventDrop,
		onEventResize,
	} = props;

	const hexToRgba = useCallback((hex: string, alpha: number): string => {
		const normalized: string = hex.replace("#", "");
		if (!normalized || normalized.length < 3) return "rgba(0, 0, 0, 0)";

		// Type assertion to ensure we have a valid hex string
		const safeNormalized: string & { length: 3 | 6 | 9 | 12 } =
			normalized as string & { length: 3 | 6 | 9 | 12 };
		const isShort: boolean = safeNormalized.length === 3;
		const rHex: string =
			isShort && safeNormalized[0]
				? safeNormalized[0] + safeNormalized[0]
				: safeNormalized.substring(0, 2);
		const gHex: string =
			isShort && safeNormalized[1]
				? safeNormalized[1] + safeNormalized[1]
				: safeNormalized.substring(2, 4);
		const bHex: string =
			isShort && safeNormalized[2]
				? safeNormalized[2] + safeNormalized[2]
				: safeNormalized.substring(4, 6);
		const r: number = Number.parseInt(rHex, 16);
		const g: number = Number.parseInt(gHex, 16);
		const b: number = Number.parseInt(bHex, 16);
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	}, []);

	const eventPropGetter = useMemo(() => {
		return (
			_event: CalendarEvent,
			_start: Date,
			_end: Date,
			_isSelected: boolean,
		) => {
			const { color } = _event;
			return {
				style: {
					backgroundColor: hexToRgba(color, 0.16),
					borderLeft: `3px solid ${color}`,
					border: "1px solid hsl(var(--calendar-event-border, var(--border)))",
					color: "#0f172a",
					borderRadius: "8px",
					boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
					padding: "4px 6px",
					lineHeight: 1.2,
					fontWeight: 500,
				},
			};
		};
	}, [hexToRgba]);

	function components() {
		const Event = ({ event }: { event: CalendarEvent }) => {
			return (
				<TooltipProvider>
					<Tooltip>
						<TooltipTrigger asChild>
							<div className="rbc-event-inner">
								<div className="rbc-event-content truncate">{event.title}</div>
							</div>
						</TooltipTrigger>
						<TooltipContent side="top" className="max-w-xs">
							<div className="space-y-1">
								<div className="font-semibold">{event.title}</div>
								<div className="text-xs text-slate-600">
									{event.start.toLocaleTimeString([], {
										hour: "2-digit",
										minute: "2-digit",
									})}{" "}
									–{" "}
									{event.end.toLocaleTimeString([], {
										hour: "2-digit",
										minute: "2-digit",
									})}
								</div>
								{event.description ? (
									<div className="text-xs text-slate-700">
										{event.description}
									</div>
								) : null}
							</div>
						</TooltipContent>
					</Tooltip>
				</TooltipProvider>
			);
		};

		return { event: Event } as const;
	}

	// Helper to ensure Date objects (library sometimes provides strings)
	const ensureDate = (value: string | Date): Date => {
		return value instanceof Date ? value : new Date(value);
	};

	return (
		<div className="rbc-theme text-sm">
			<DragAndDropCalendar
				localizer={localizer}
				events={events}
				startAccessor="start"
				endAccessor="end"
				resources={resources}
				resourceIdAccessor="id"
				resourceTitleAccessor="title"
				resourceAccessor="resourceId"
				views={[Views.DAY]}
				defaultView={Views.DAY}
				toolbar={false}
				date={_date}
				onNavigate={(_date: Date) => onNavigate?.(_date)}
				step={30}
				timeslots={2}
				min={new Date(1970, 0, 1, 5, 0)}
				max={new Date(1970, 0, 1, 20, 0)}
				selectable
				onSelectEvent={(e: CalendarEvent) => onSelectEvent?.(e)}
				onSelectSlot={(_slotInfo: { start: Date; end: Date }) =>
					onSelectSlot?.({ start: _slotInfo.start, end: _slotInfo.end })
				}
				// Now properly typed to match EventInteractionArgs
				onEventDrop={(args: EventInteractionArgs<CalendarEvent>) => {
					if (onEventDrop) {
						// Convert stringOrDate to Date if needed
						const normalizedArgs: EventInteractionArgs<CalendarEvent> = {
							...args,
							start: ensureDate(args.start),
							end: ensureDate(args.end),
						};
						void onEventDrop(normalizedArgs);
					}
				}}
				onEventResize={(args: EventInteractionArgs<CalendarEvent>) => {
					if (onEventResize) {
						// Convert stringOrDate to Date if needed
						const normalizedArgs: EventInteractionArgs<CalendarEvent> = {
							...args,
							start: ensureDate(args.start),
							end: ensureDate(args.end),
						};
						void onEventResize(normalizedArgs);
					}
				}}
				style={{ height: "100%" }}
				eventPropGetter={eventPropGetter}
				scrollToTime={new Date(1970, 0, 1, 8, 0)}
				dayLayoutAlgorithm="no-overlap"
				components={components()}
				draggableAccessor={() => true}
				resizable
			/>
		</div>
	);
}
