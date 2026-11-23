import type {
	DayPrice,
	PricesResponse,
	SettingsResponse,
} from "@hpc/contracts";
import { describe, expect, it } from "vitest";
import { getDayByDate, getDefaultRoomId, getRoomDays } from "./selectors";

const day = {
	roomId: "1001",
	date: "2026-11-23",
	currency: "NZD",
	status: "auto",
	price: 189,
	priceInPms: 182,
	recommendedPrice: 197,
	variance: { value: 4.2, direction: "up", severity: "high", label: "+4.2%" },
	availability: "available",
	occupancy: 0.72,
	restrictions: [],
	isClosed: false,
	error: null,
} as DayPrice;

const settings: SettingsResponse = {
	hotel: { timezone: "Pacific/Auckland", locale: "en-NZ", currency: "NZD" },
	rooms: [
		{ id: "1002", name: "Double Room", isReference: false },
		{ id: "1001", name: "Single Room", isReference: true },
	],
	dateRange: { from: "2026-11-23", to: "2026-11-24" },
};

const prices: PricesResponse = {
	timezone: "Pacific/Auckland",
	currency: "NZD",
	generatedAt: "2026-11-23T22:30:00.000Z",
	rooms: [
		{ roomId: "1001", name: "Single Room", days: [day] },
		{ roomId: "1002", name: "Double Room", days: [] },
	],
};

describe("headless selectors", () => {
	it("prefers the backend reference room", () => {
		expect(getDefaultRoomId(settings)).toBe("1001");
		expect(getDefaultRoomId(undefined)).toBeNull();
	});

	it("selects only the active room days", () => {
		expect(getRoomDays(prices, "1001")).toEqual([day]);
		expect(getRoomDays(prices, "9999")).toEqual([]);
		expect(getRoomDays(undefined, "1001")).toEqual([]);
	});

	it("finds a day by its backend date", () => {
		expect(getDayByDate([day], "2026-11-23")).toEqual(day);
		expect(getDayByDate([day], "2026-11-24")).toBeUndefined();
	});
});
