export const englishMessages = {
	"calendar.loading": "Loading fixture-backed pricing data…",
	"calendar.errorTitle": "Unable to load pricing data",
	"calendar.errorBody": "{message} Check the fixture response and try again.",
	"calendar.retry": "Retry",
	"calendar.fixtureBadge": "Fixture data",
	"calendar.noBackend": "No live backend connected",
	"calendar.title": "Pricing Calendar",
	"calendar.intro":
		"A reference UI for prices computed by an external backend. This demo renders static fixtures and never calculates, recommends or validates a price itself.",
	"calendar.introLive":
		"A reference UI for prices computed by an external backend. Values come from the configured backend; the UI never calculates, recommends or validates a price itself.",
	"calendar.backendBadge": "Backend connected",
	"calendar.integrateLink": "How to integrate",
	"calendar.timezone": "Timezone",
	"calendar.locale": "Locale",
	"calendar.roomsLabel": "Rooms",
	"calendar.noDay": "No day",
	"calendar.previousDay": "Previous Day",
	"calendar.nextDay": "Next Day",
	"calendar.from": "From",
	"calendar.to": "To",
	"calendar.today": "Today",
	"calendar.previousMonth": "Previous month",
	"calendar.nextMonth": "Next month",
	"calendar.days": "{count} days",
	"calendar.pricesLabel": "Prices in",
	"calendar.multipleCurrencies": "multiple currencies",
	"table.caption": "Backend-provided prices for {room}",
	"table.date": "Date",
	"table.price": "Price",
	"table.status": "Status",
	"table.recommended": "Recommended",
	"table.availability": "Availability",
	"table.notes": "Notes",
	"table.actions": "Actions",
	"table.inPms": "In PMS:",
	"table.variance": "Variance:",
	"table.occupied": "{percent} occupied",
	"table.editDay": "Edit price for {date}",
	"notes.restricted": "Restricted: {restriction}",
	"notes.error": "Error: {message}",
	"status.auto": "Automated",
	"status.closed": "Closed",
	"status.manual": "Manual",
	"status.unavailable": "Unavailable",
	"availability.available": "Available",
	"availability.restricted": "Restricted",
	"availability.sold_out": "Sold out",
	"availability.unavailable": "Unavailable",
	"editor.close": "Close editor",
	"editor.valuesLabel": "Values in",
	"editor.description":
		"Backend values stay read-only. Save submits a manual price intent.",
	"editor.backendPrice": "Backend price",
	"editor.recommended": "Recommended",
	"editor.variance": "Variance",
	"editor.price": "Price",
	"editor.reason": "Reason",
	"editor.reasonPlaceholder": "e.g. Peak demand…",
	"editor.cancel": "Cancel",
	"editor.saving": "Saving…",
	"editor.save": "Save Manual Price",
	"editor.noWrite":
		"This fixture day has no canonical update response. Choose a day with one to try a write.",
	"editor.accepted": "Backend accepted {price} with status {status}.",
	"editor.defaultReason": "Manual override",
	"empty.title": "No prices in this range",
	"empty.body":
		"No fixture data for this period. Choose another range to see the demo prices.",
	"empty.action": "Show fixture range",
	"footer.note": "All values come from the fixture response. See the",
	"footer.reference": "OpenAPI Reference",
} as const;

export type MessageKey = keyof typeof englishMessages;
export type Messages = Partial<Record<MessageKey, string>>;

export interface PricingCalendarLocaleConfig {
	locale?: string;
	title?: string;
	messages?: unknown;
	messagesUrl?: string;
}

declare global {
	interface Window {
		pricingCalendarI18n?: PricingCalendarLocaleConfig;
	}
}

let locale = "en";
let messages: Messages = {};

export function getLocale(): string {
	return locale;
}

export function setLocale(value: string | undefined): void {
	locale = value || "en";
}

export function hasMessage(key: string): boolean {
	return key in messages || key in englishMessages;
}

export function t(
	key: MessageKey,
	values?: Record<string, string | number>,
): string {
	const template = messages[key] ?? englishMessages[key];
	return template.replace(/\{(\w+)\}/g, (_, name: string) =>
		values && name in values ? String(values[name]) : `{${name}}`,
	);
}

export function resolveMessages(input: unknown): Messages {
	if (!input || typeof input !== "object" || Array.isArray(input)) {
		return {};
	}

	const resolved: Messages = {};
	for (const key of Object.keys(englishMessages) as MessageKey[]) {
		const value = (input as Record<string, unknown>)[key];
		if (typeof value === "string") {
			resolved[key] = value;
		}
	}
	return resolved;
}

export function setMessages(next: Messages): void {
	messages = { ...next };
}

export async function loadLocale(): Promise<void> {
	const config = window.pricingCalendarI18n ?? {};
	setLocale(config.locale);
	if (config.locale) {
		document.documentElement.lang = config.locale;
	}
	if (config.title) {
		document.title = config.title;
	}

	let source = config.messages;
	if (config.messagesUrl) {
		const url = new URL(config.messagesUrl, window.location.href);
		if (url.origin !== window.location.origin) {
			console.warn("pricingCalendarI18n.messagesUrl must be same-host");
		} else {
			// A stalled messages file must never block the first render.
			const controller = new AbortController();
			const timer = setTimeout(() => controller.abort(), 3000);
			try {
				const response = await fetch(url, { signal: controller.signal });
				if (!response.ok) {
					throw new Error(`HTTP ${response.status}`);
				}
				source = await response.json();
			} catch {
				console.warn("Could not load pricingCalendarI18n.messagesUrl");
			} finally {
				clearTimeout(timer);
			}
		}
	}

	setMessages(resolveMessages(source));
}
