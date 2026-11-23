import { describe, expect, it } from "vitest";
import {
	apiPaths,
	ContractValidationError,
	type DayPrice,
	PricesResponseSchema,
	parseContract,
	SettingsResponseSchema,
	UpdatePriceResponseSchema,
} from "./index";

const dayPrice: DayPrice = {
	roomId: "1001",
	date: "2026-11-23",
	status: "auto",
	currency: "NZD",
	price: 189,
	priceInPms: 182,
	recommendedPrice: 197,
	variance: {
		value: 4.2,
		direction: "up",
		severity: "high",
		label: "+4.2%",
	},
	availability: "available",
	occupancy: 0.72,
	restrictions: ["min-stay:2"],
	isClosed: false,
	error: null,
};

const roomPrices = {
	roomId: "1001",
	name: "Single Room",
	days: [dayPrice],
};

const pricesPayload = {
	timezone: "Pacific/Auckland",
	currency: "NZD",
	generatedAt: "2026-11-23T22:30:00.000Z",
	rooms: [roomPrices],
};

const settingsPayload = {
	hotel: {
		timezone: "Pacific/Auckland",
		locale: "en-NZ",
		currency: "NZD",
	},
	rooms: [
		{ id: "1001", name: "Single Room", isReference: true },
		{ id: "1002", name: "Double Room", isReference: false },
	],
	dateRange: {
		from: "2026-11-23",
		to: "2027-11-23",
	},
};

describe("external API contracts", () => {
	it("accepts a complete settings payload", () => {
		const result = SettingsResponseSchema.parse(settingsPayload);
		expect(result.rooms).toHaveLength(2);
		expect(result.hotel.currency).toBe("NZD");
	});

	it("accepts fully precomputed day prices", () => {
		const result = PricesResponseSchema.parse(pricesPayload);
		expect(result.rooms[0]?.days[0]?.variance).toEqual({
			value: 4.2,
			direction: "up",
			severity: "high",
			label: "+4.2%",
		});
	});

	it("rejects variance without backend-computed direction and severity", () => {
		const invalid = {
			...pricesPayload,
			rooms: [
				{
					...roomPrices,
					days: [
						{
							...dayPrice,
							variance: { value: 4.2, label: "+4.2%" },
						},
					],
				},
			],
		};

		expect(PricesResponseSchema.safeParse(invalid).success).toBe(false);
	});

	it("rejects unknown price statuses", () => {
		const invalid = {
			...pricesPayload,
			rooms: [
				{
					...roomPrices,
					days: [{ ...dayPrice, status: "discount" }],
				},
			],
		};

		expect(PricesResponseSchema.safeParse(invalid).success).toBe(false);
	});

	it("accepts the canonical response from a price update", () => {
		const result = UpdatePriceResponseSchema.parse({
			day: { ...dayPrice, status: "manual", price: 205 },
			acceptedAt: "2026-11-23T22:31:00.000Z",
		});

		expect(result.day.price).toBe(205);
		expect(result.day.status).toBe("manual");
	});

	it("builds base-relative API paths", () => {
		expect(apiPaths.settings).toBe("/settings");
		expect(
			apiPaths.prices({
				from: "2026-11-23",
				to: "2026-11-30",
				rooms: ["1001", "1002"],
			}),
		).toBe("/prices?from=2026-11-23&to=2026-11-30&room=1001&room=1002");
		expect(apiPaths.price("room 1", "2026-11-23")).toBe(
			"/prices/room%201/2026-11-23",
		);
	});

	it("throws a labelled validation error through parseContract", () => {
		expect(() => parseContract(SettingsResponseSchema, {}, "settings")).toThrow(
			ContractValidationError,
		);
		expect(() => parseContract(SettingsResponseSchema, {}, "settings")).toThrow(
			"Invalid settings payload",
		);
	});
});
