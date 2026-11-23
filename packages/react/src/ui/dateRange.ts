const dateFormatter = new Intl.DateTimeFormat("en", {
	day: "numeric",
	month: "short",
	timeZone: "UTC",
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

export function formatDateLabel(date: string): string {
	const parsed = new Date(`${date}T00:00:00Z`);
	return Number.isNaN(parsed.getTime()) ? date : dateFormatter.format(parsed);
}
