import type { DayPrice } from "@hpc/contracts";
import { describe, expect, it } from "vitest";
import { formatMoney, formatPercent, getDayNotes, statusTone } from "./format";

const day: DayPrice = {
	roomId: "1001",
	date: "2026-11-23",
	status: "manual",
	currency: "NZD",
	price: 189,
	priceInPms: 182,
	recommendedPrice: 197,
	variance: null,
	availability: "restricted",
	occupancy: 0.72,
	restrictions: ["min-stay:2"],
	isClosed: false,
	error: { code: "RATE_MISSING", message: "Rate missing" },
};

describe("numeric formatting", () => {
	it("uses the locale decimal separator without a currency symbol", () => {
		expect(formatMoney(1234.5, "en")).toBe("1,234.5");
		expect(formatMoney(1234.5, "es")).toBe("1.234,5");
		expect(formatMoney(null, "en")).toBe("—");
	});

	it("formats percentages with Intl", () => {
		expect(formatPercent(0.42, "en")).toBe("42%");
		expect(formatPercent(null, "en")).toBe("—");
	});
});

describe("statusTone", () => {
	it("maps backend statuses to semantic badge tones", () => {
		expect(statusTone("auto")).toBe("default");
		expect(statusTone("manual")).toBe("secondary");
		expect(statusTone("closed")).toBe("destructive");
		expect(statusTone("unavailable")).toBe("outline");
	});
});

describe("getDayNotes", () => {
	it("keeps only restrictions and backend errors", () => {
		const notes = getDayNotes(day);
		expect(notes.map((note) => note.label)).toEqual([
			"Restricted: min-stay:2",
			"Error: Rate missing",
		]);
		expect(notes.some((note) => note.label.includes("72%"))).toBe(false);
		expect(notes.some((note) => note.label.includes("Manual"))).toBe(false);
	});
});
