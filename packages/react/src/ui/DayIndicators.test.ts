import type { DayPrice } from "@hpc/contracts";
import { describe, expect, it } from "vitest";
import { getDayIndicators } from "./DayIndicators";
import { formatAvailability, formatPercent } from "./format";

const makeDay = (overrides: Partial<DayPrice> = {}): DayPrice => ({
	roomId: "1001",
	date: "2026-11-23",
	status: "auto",
	currency: "NZD",
	price: 189,
	priceInPms: 182,
	recommendedPrice: 197,
	variance: null,
	availability: "available",
	occupancy: 0.72,
	restrictions: [],
	isClosed: false,
	error: null,
	...overrides,
});

describe("getDayIndicators", () => {
	it("renders manual price indicators from backend status", () => {
		expect(
			getDayIndicators(makeDay({ status: "manual" })).map((item) => item.label),
		).toContain("Manual price");
	});

	it("renders closed dates without deriving availability", () => {
		const labels = getDayIndicators(
			makeDay({
				status: "closed",
				price: null,
				availability: "unavailable",
				occupancy: null,
				isClosed: true,
				restrictions: ["closed"],
			}),
		).map((item) => item.label);
		expect(labels).toContain("Closed date");
		expect(labels).not.toContain("Availability: Unavailable");
		expect(labels).toContain("Restricted: closed");
	});

	it("renders restrictions, occupancy and variance as text", () => {
		const labels = getDayIndicators(
			makeDay({
				restrictions: ["min-stay:2"],
				variance: {
					value: 4.2,
					direction: "up",
					severity: "high",
					label: "+4.2%",
				},
			}),
		).map((item) => item.label);
		expect(labels).toContain("Restricted: min-stay:2");
		expect(labels).toContain("Occupancy: 72%");
		expect(labels).toContain("Variance: +4.2%");
	});

	it("renders backend errors verbatim", () => {
		const labels = getDayIndicators(
			makeDay({
				status: "unavailable",
				availability: "sold_out",
				error: { code: "NO_INVENTORY", message: "No inventory available" },
			}),
		).map((item) => item.label);
		expect(labels).toContain("Availability: Sold out");
		expect(labels).toContain("Error: No inventory available");
	});

	it("formats backend enums and ratios for display", () => {
		expect(formatAvailability("sold_out")).toBe("Sold out");
		expect(formatPercent(0.815)).toBe("82%");
	});
});
