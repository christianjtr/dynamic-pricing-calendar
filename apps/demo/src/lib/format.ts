import type { DayPrice } from "@hpc/contracts";

const dayFormatters = new Map<string, Intl.DateTimeFormat>();
const numberFormatters = new Map<string, Intl.NumberFormat>();
const percentFormatters = new Map<string, Intl.NumberFormat>();

function getDayFormatter(locale: string): Intl.DateTimeFormat {
	let formatter = dayFormatters.get(locale);
	if (!formatter) {
		formatter = new Intl.DateTimeFormat(locale, {
			day: "numeric",
			month: "short",
			timeZone: "UTC",
			weekday: "short",
		});
		dayFormatters.set(locale, formatter);
	}
	return formatter;
}

function getNumberFormatter(locale: string): Intl.NumberFormat {
	let formatter = numberFormatters.get(locale);
	if (!formatter) {
		formatter = new Intl.NumberFormat(locale, {
			maximumFractionDigits: 2,
			useGrouping: true,
		});
		numberFormatters.set(locale, formatter);
	}
	return formatter;
}

function getPercentFormatter(locale: string): Intl.NumberFormat {
	let formatter = percentFormatters.get(locale);
	if (!formatter) {
		formatter = new Intl.NumberFormat(locale, {
			maximumFractionDigits: 0,
			style: "percent",
		});
		percentFormatters.set(locale, formatter);
	}
	return formatter;
}

export function buildDateRange(from: string, to: string): string[] {
	const dates: string[] = [];
	const current = new Date(`${from}T00:00:00Z`);
	const end = new Date(`${to}T00:00:00Z`);

	if (Number.isNaN(current.getTime()) || Number.isNaN(end.getTime())) {
		return dates;
	}

	while (current <= end && dates.length < 366) {
		dates.push(current.toISOString().slice(0, 10));
		current.setUTCDate(current.getUTCDate() + 1);
	}

	return dates;
}

export function formatDate(date: string, locale = "en"): string {
	const parsed = new Date(`${date}T00:00:00Z`);
	return Number.isNaN(parsed.getTime())
		? date
		: getDayFormatter(locale).format(parsed);
}

export function formatMoney(value: number | null, locale = "en"): string {
	if (value === null) {
		return "—";
	}
	return getNumberFormatter(locale).format(value);
}

export function formatPercent(value: number | null, locale = "en"): string {
	if (value === null) {
		return "—";
	}
	return getPercentFormatter(locale).format(value);
}

export function formatStatus(status: string): string {
	const labels: Record<string, string> = {
		auto: "Automated",
		closed: "Closed",
		manual: "Manual",
		unavailable: "Unavailable",
	};
	return labels[status] ?? status;
}

export function formatAvailability(availability: string): string {
	const labels: Record<string, string> = {
		available: "Available",
		restricted: "Restricted",
		sold_out: "Sold out",
		unavailable: "Unavailable",
	};
	return labels[availability] ?? availability;
}

export type StatusTone = "default" | "secondary" | "outline" | "destructive";

export function statusTone(status: string): StatusTone {
	switch (status) {
		case "auto":
			return "default";
		case "closed":
			return "destructive";
		case "manual":
			return "secondary";
		default:
			return "outline";
	}
}

export interface DayNote {
	label: string;
	tone: "default" | "danger";
}

export function getDayNotes(day: DayPrice): DayNote[] {
	const notes: DayNote[] = day.restrictions.map((restriction) => ({
		label: `Restricted: ${restriction}`,
		tone: "default",
	}));
	if (day.error) {
		notes.push({ label: `Error: ${day.error.message}`, tone: "danger" });
	}
	return notes;
}
