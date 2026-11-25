export interface DateRange {
	from: string;
	to: string;
}

export interface RangePageLocation {
	pathname: string;
	search: string;
	hash: string;
}

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

function isIsoDate(value: string | null): value is string {
	if (!value || !isoDate.test(value)) {
		return false;
	}

	const parsed = new Date(`${value}T00:00:00Z`);
	return (
		!Number.isNaN(parsed.getTime()) &&
		parsed.toISOString().slice(0, 10) === value
	);
}

export function readDateRange(search: string, fallback: DateRange): DateRange {
	const params = new URLSearchParams(search);
	const from = params.get("from");
	const to = params.get("to");

	if (!isIsoDate(from) || !isIsoDate(to) || from > to) {
		return { ...fallback };
	}

	return { from, to };
}

export function dateRangeHref(
	location: RangePageLocation,
	range: DateRange,
): string {
	const params = new URLSearchParams(location.search);
	params.set("from", range.from);
	params.set("to", range.to);
	return `${location.pathname}?${params.toString()}${location.hash}`;
}

function shiftDate(date: string, delta: number): string {
	const parsed = new Date(`${date}T00:00:00Z`);
	if (Number.isNaN(parsed.getTime())) {
		return date;
	}

	const day = parsed.getUTCDate();
	parsed.setUTCDate(1);
	parsed.setUTCMonth(parsed.getUTCMonth() + delta);
	const lastDay = new Date(
		Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth() + 1, 0),
	).getUTCDate();
	parsed.setUTCDate(Math.min(day, lastDay));
	return parsed.toISOString().slice(0, 10);
}

export function shiftMonth(range: DateRange, delta: number): DateRange {
	return { from: shiftDate(range.from, delta), to: shiftDate(range.to, delta) };
}
