import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	getLocale,
	hasMessage,
	loadLocale,
	resolveMessages,
	setLocale,
	setMessages,
	t,
} from "./i18n";

beforeEach(() => {
	setLocale("en");
	setMessages({});
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe("in-house locale registry", () => {
	it("falls back to English and interpolates values", () => {
		expect(t("calendar.days", { count: 7 })).toBe("7 days");
		expect(t("table.occupied", { percent: "55%" })).toBe("55% occupied");
		expect(t("empty.body")).toBe(
			"No prices returned for this period. Choose another range to see the data.",
		);
	});

	it("uses integrator messages and ignores unknown keys", () => {
		setLocale("es-NZ");
		setMessages(
			resolveMessages({
				"calendar.title": "Calendario de precios",
				"calendar.days": "{count} días",
				"table.date": 42,
				"status.custom": "Personalizado",
			}),
		);

		expect(getLocale()).toBe("es-NZ");
		expect(t("calendar.title")).toBe("Calendario de precios");
		expect(t("calendar.days", { count: 3 })).toBe("3 días");
		expect(t("table.date")).toBe("Date");
		expect(hasMessage("status.custom")).toBe(false);
	});

	it("keeps only known string keys", () => {
		expect(
			resolveMessages({
				"table.price": "Precio",
				"table.date": 1,
				other: "ignored",
			}),
		).toEqual({ "table.price": "Precio" });
	});

	it("aborts a stalled messagesUrl so the first render is not blocked", async () => {
		vi.useFakeTimers();
		vi.stubGlobal("window", {
			location: { href: "http://localhost/", origin: "http://localhost" },
			pricingCalendarI18n: { messagesUrl: "/i18n/stalled.json" },
		});
		vi.stubGlobal("document", {
			documentElement: { lang: "en" },
			title: "",
		});
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		const fetchMock = vi.fn(
			(_url: URL, init: RequestInit) =>
				new Promise<Response>((_resolve, reject) => {
					init.signal?.addEventListener("abort", () =>
						reject(new Error("aborted")),
					);
				}),
		);
		vi.stubGlobal("fetch", fetchMock);

		const pending = loadLocale();
		await vi.advanceTimersByTimeAsync(3001);
		await pending;

		expect(fetchMock).toHaveBeenCalledOnce();
		expect(warn).toHaveBeenCalled();
		expect(t("calendar.title")).toBe("Pricing Calendar");
	});
});
