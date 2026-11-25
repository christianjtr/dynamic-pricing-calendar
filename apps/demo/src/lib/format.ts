import type { DayPrice } from "@hpc/contracts";

const currencyFormatters = new Map<string, Intl.NumberFormat>();
const dayFormatter = new Intl.DateTimeFormat("en", {
	day: "numeric",
	month: "short",
	timeZone: "UTC",
	weekday: "short",
});

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

export function formatDate(date: string): string {
	const parsed = new Date(`${date}T00:00:00Z`);
	return Number.isNaN(parsed.getTime()) ? date : dayFormatter.format(parsed);
}

export function formatMoney(value: number | null, currency: string): string {
	if (value === null) {
		return "—";
	}

	let formatter = currencyFormatters.get(currency);
	if (!formatter) {
		formatter = new Intl.NumberFormat("en", {
			currency,
			maximumFractionDigits: 0,
			style: "currency",
		});
		currencyFormatters.set(currency, formatter);
	}
	return formatter.format(value);
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

export interface DayIndicator {
	label: string;
	tone: "default" | "accent" | "danger";
}

export function getDayIndicators(day: DayPrice): DayIndicator[] {
	const indicators: DayIndicator[] = [];

	if (day.status === "closed" || day.isClosed) {
		indicators.push({ label: "Closed date", tone: "danger" });
	}
	if (day.status === "manual") {
		indicators.push({ label: "Manual price", tone: "accent" });
	}
	if (day.availability !== "available" && day.status !== "closed") {
		indicators.push({
			label: `Availability: ${formatAvailability(day.availability)}`,
			tone: "default",
		});
	}
	for (const restriction of day.restrictions) {
		indicators.push({ label: `Restricted: ${restriction}`, tone: "default" });
	}
	if (day.occupancy !== null) {
		indicators.push({
			label: `Occupancy: ${Math.round(day.occupancy * 100)}%`,
			tone: "default",
		});
	}
	if (day.error) {
		indicators.push({ label: `Error: ${day.error.message}`, tone: "danger" });
	}

	return indicators;
}
