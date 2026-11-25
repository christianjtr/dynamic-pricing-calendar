import { beforeEach, describe, expect, it } from "vitest";
import {
	getLocale,
	hasMessage,
	resolveMessages,
	setLocale,
	setMessages,
	t,
} from "./i18n";

beforeEach(() => {
	setLocale("en");
	setMessages({});
});

describe("in-house locale registry", () => {
	it("falls back to English and interpolates values", () => {
		expect(t("calendar.days", { count: 7 })).toBe("7 days");
		expect(t("table.occupied", { percent: "55%" })).toBe("55% occupied");
		expect(t("empty.body")).toBe(
			"No fixture data for this period. Choose another range to see the demo prices.",
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
});
