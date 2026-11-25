import { describe, expect, it } from "vitest";
import {
	dateRangeHref,
	hasExplicitDateRange,
	rangeAroundDay,
	readDateRange,
	shiftMonth,
	todayInTimeZone,
} from "./dateRange";

const fallback = { from: "2026-11-23", to: "2026-11-29" };

describe("date range URL", () => {
	it("reads a valid range and falls back for invalid or reversed dates", () => {
		expect(readDateRange("?from=2026-12-01&to=2026-12-31", fallback)).toEqual({
			from: "2026-12-01",
			to: "2026-12-31",
		});
		expect(readDateRange("?from=2026-12-31&to=2026-12-01", fallback)).toEqual(
			fallback,
		);
		expect(readDateRange("?from=2026-02-30&to=2026-12-01", fallback)).toEqual(
			fallback,
		);
	});

	it("detects only complete, valid URL ranges", () => {
		expect(hasExplicitDateRange("?from=2026-12-01&to=2026-12-31")).toBe(true);
		expect(hasExplicitDateRange("?from=2026-12-01")).toBe(false);
		expect(hasExplicitDateRange("")).toBe(false);
		expect(hasExplicitDateRange("?from=2026-12-31&to=2026-12-01")).toBe(false);
	});

	it("writes the range while preserving other parameters and the hash", () => {
		expect(
			dateRangeHref(
				{
					pathname: "/",
					search: "?room=1002&date=2026-11-24",
					hash: "#calendar",
				},
				{ from: "2026-12-01", to: "2026-12-31" },
			),
		).toBe(
			"/?room=1002&date=2026-11-24&from=2026-12-01&to=2026-12-31#calendar",
		);
	});

	it("shifts months across year boundaries and clamps short months", () => {
		expect(shiftMonth(fallback, 1)).toEqual({
			from: "2026-12-23",
			to: "2026-12-29",
		});
		expect(shiftMonth(fallback, 2)).toEqual({
			from: "2027-01-23",
			to: "2027-01-29",
		});
		expect(shiftMonth({ from: "2027-01-23", to: "2027-01-29" }, 1)).toEqual({
			from: "2027-02-23",
			to: "2027-02-28",
		});
	});
});

describe("today helpers", () => {
	it("resolves today in the hotel timezone, not the browser timezone", () => {
		expect(
			todayInTimeZone("Pacific/Auckland", new Date("2026-11-25T12:00:00Z")),
		).toBe("2026-11-26");
		expect(
			todayInTimeZone("Pacific/Auckland", new Date("2026-11-25T10:00:00Z")),
		).toBe("2026-11-25");
	});

	it("builds a seven-day range centred on a day", () => {
		expect(rangeAroundDay("2026-11-25")).toEqual({
			from: "2026-11-22",
			to: "2026-11-28",
		});
		expect(rangeAroundDay("2026-12-31")).toEqual({
			from: "2026-12-28",
			to: "2027-01-03",
		});
	});
});
