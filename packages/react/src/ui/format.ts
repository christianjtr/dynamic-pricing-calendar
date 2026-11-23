const currencyFormatters = new Map<string, Intl.NumberFormat>();

export function formatCurrency(value: number | null, currency: string): string {
	if (value === null) {
		return "—";
	}
	let formatter = currencyFormatters.get(currency);
	if (!formatter) {
		formatter = new Intl.NumberFormat("en", {
			style: "currency",
			currency,
			maximumFractionDigits: 0,
		});
		currencyFormatters.set(currency, formatter);
	}
	return formatter.format(value);
}

const statusLabels: Record<string, string> = {
	auto: "Automated",
	manual: "Manual",
	closed: "Closed",
	unavailable: "Unavailable",
};

export function formatStatus(status: string): string {
	return statusLabels[status] ?? status;
}

const availabilityLabels: Record<string, string> = {
	available: "Available",
	restricted: "Restricted",
	sold_out: "Sold out",
	unavailable: "Unavailable",
};

export function formatAvailability(availability: string): string {
	return availabilityLabels[availability] ?? availability;
}

export function formatPercent(value: number): string {
	return `${Math.round(value * 100)}%`;
}
