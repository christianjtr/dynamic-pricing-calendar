import type { DayPrice } from "@hpc/contracts";
import { getLocale, hasMessage, type MessageKey, t } from "./i18n";

const dayFormatters = new Map<string, Intl.DateTimeFormat>();
const numberFormatters = new Map<string, Intl.NumberFormat>();
const percentFormatters = new Map<string, Intl.NumberFormat>();

function cachedFormatter<T>(
	cache: Map<string, T>,
	locale: string,
	create: (value: string) => T,
): T {
	let formatter = cache.get(locale);
	if (!formatter) {
		try {
			formatter = create(locale);
		} catch {
			formatter = create("en");
		}
		cache.set(locale, formatter);
	}
	return formatter;
}

function getDayFormatter(locale: string): Intl.DateTimeFormat {
	return cachedFormatter(
		dayFormatters,
		locale,
		(value) =>
			new Intl.DateTimeFormat(value, {
				day: "numeric",
				month: "short",
				timeZone: "UTC",
				weekday: "short",
			}),
	);
}

function getNumberFormatter(locale: string): Intl.NumberFormat {
	return cachedFormatter(
		numberFormatters,
		locale,
		(value) =>
			new Intl.NumberFormat(value, {
				maximumFractionDigits: 2,
				useGrouping: true,
			}),
	);
}

function getPercentFormatter(locale: string): Intl.NumberFormat {
	return cachedFormatter(
		percentFormatters,
		locale,
		(value) =>
			new Intl.NumberFormat(value, {
				maximumFractionDigits: 0,
				style: "percent",
			}),
	);
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

export function formatDate(date: string, locale = getLocale()): string {
	const parsed = new Date(`${date}T00:00:00Z`);
	return Number.isNaN(parsed.getTime())
		? date
		: getDayFormatter(locale).format(parsed);
}

export function formatMoney(
	value: number | null,
	locale = getLocale(),
): string {
	if (value === null) {
		return "—";
	}
	return getNumberFormatter(locale).format(value);
}

export function formatPercent(
	value: number | null,
	locale = getLocale(),
): string {
	if (value === null) {
		return "—";
	}
	return getPercentFormatter(locale).format(value);
}

export function formatStatus(status: string): string {
	const key = `status.${status}`;
	return hasMessage(key) ? t(key as MessageKey) : status;
}

export function formatAvailability(availability: string): string {
	const key = `availability.${availability}`;
	return hasMessage(key) ? t(key as MessageKey) : availability;
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
		label: t("notes.restricted", { restriction }),
		tone: "default",
	}));
	if (day.error) {
		notes.push({
			label: t("notes.error", { message: day.error.message }),
			tone: "danger",
		});
	}
	return notes;
}
