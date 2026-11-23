import { describe, expect, it } from "vitest";
import { buildDateRange, formatDateLabel } from "./dateRange";

describe("dateRange", () => {
	it("builds inclusive ISO dates without timezones", () => {
		expect(buildDateRange("2026-11-23", "2026-11-25")).toEqual([
			"2026-11-23",
			"2026-11-24",
			"2026-11-25",
		]);
	});

	it("returns an empty list for invalid dates", () => {
		expect(buildDateRange("invalid", "2026-11-25")).toEqual([]);
	});

	it("formats dates for column headers", () => {
		expect(formatDateLabel("2026-11-23")).toBe("Nov 23");
	});
});
