import {
	ContractValidationError,
	type DayPrice,
	type PricesResponse,
	type SettingsResponse,
	type UpdatePriceResponse,
} from "@hpc/contracts";
import { describe, expect, it, vi } from "vitest";
import { createPricingClient, PricingApiError } from "./client";

const settings: SettingsResponse = {
	hotel: { timezone: "Pacific/Auckland", locale: "en-NZ", currency: "NZD" },
	rooms: [{ id: "1001", name: "Single Room", isReference: true }],
	dateRange: { from: "2026-11-23", to: "2026-11-24" },
};

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

const prices: PricesResponse = {
	timezone: "Pacific/Auckland",
	currency: "NZD",
	generatedAt: "2026-11-23T22:30:00.000Z",
	rooms: [{ roomId: "1001", name: "Single Room", days: [day] }],
};

const update: UpdatePriceResponse = {
	day: { ...day, status: "manual", price: 205, variance: null },
	acceptedAt: "2026-11-23T22:31:00.000Z",
};

const jsonResponse = (body: unknown, status = 200) =>
	({
		ok: status >= 200 && status < 300,
		status,
		json: async () => body,
	}) as Response;

describe("createPricingClient", () => {
	it("sends injected headers and validates settings", async () => {
		const fetchMock = vi.fn(async () => jsonResponse(settings));
		const client = createPricingClient({
			baseUrl: "https://be.test/backend/",
			propertyId: "hotel-1",
			fetch: fetchMock as unknown as typeof fetch,
			headers: async () => ({ Authorization: "Bearer token" }),
			credentials: "include",
		});

		const result = await client.getSettings();

		expect(result).toEqual(settings);
		expect(fetchMock).toHaveBeenCalledWith(
			"https://be.test/backend/settings",
			expect.objectContaining({
				method: "GET",
				credentials: "include",
				headers: {
					Accept: "application/json",
					"x-property-id": "hotel-1",
					Authorization: "Bearer token",
				},
			}),
		);
	});

	it("builds prices paths from the contract and forwards the abort signal", async () => {
		const fetchMock = vi.fn(async () => jsonResponse(prices));
		const client = createPricingClient({
			baseUrl: "https://be.test",
			propertyId: "hotel-1",
			fetch: fetchMock as unknown as typeof fetch,
		});
		const controller = new AbortController();

		await client.getPrices(
			{ from: "2026-11-23", to: "2026-11-24", rooms: ["1001"] },
			controller.signal,
		);

		expect(fetchMock).toHaveBeenCalledWith(
			"https://be.test/prices?from=2026-11-23&to=2026-11-24&room=1001",
			expect.objectContaining({ signal: controller.signal }),
		);
	});

	it("returns the canonical backend response for a price update", async () => {
		const fetchMock = vi.fn(
			async (_input: RequestInfo | URL, _init?: RequestInit) =>
				jsonResponse(update),
		);
		const client = createPricingClient({
			baseUrl: "https://be.test",
			propertyId: "hotel-1",
			fetch: fetchMock as unknown as typeof fetch,
		});

		const result = await client.updatePrice("1001", "2026-11-23", {
			price: 999,
			reason: "manual override",
		});

		expect(result).toEqual(update);
		expect(result.day.price).toBe(205);
		expect(fetchMock).toHaveBeenCalledWith(
			"https://be.test/prices/1001/2026-11-23",
			expect.objectContaining({
				method: "PATCH",
				body: JSON.stringify({ price: 999, reason: "manual override" }),
			}),
		);
	});

	it("maps API errors to PricingApiError", async () => {
		const fetchMock = vi.fn(async () =>
			jsonResponse(
				{ error: { code: "NO_INVENTORY", message: "No inventory available" } },
				409,
			),
		);
		const client = createPricingClient({
			baseUrl: "https://be.test",
			propertyId: "hotel-1",
			fetch: fetchMock as unknown as typeof fetch,
		});

		await expect(
			client.updatePrice("1001", "2026-11-23", { price: 205 }),
		).rejects.toMatchObject({
			name: "PricingApiError",
			status: 409,
			code: "NO_INVENTORY",
		});
		expect(PricingApiError).toBeDefined();
	});

	it("rejects payloads that do not match the contract", async () => {
		const fetchMock = vi.fn(async () => jsonResponse({ hotel: {} }));
		const client = createPricingClient({
			baseUrl: "https://be.test",
			propertyId: "hotel-1",
			fetch: fetchMock as unknown as typeof fetch,
		});

		await expect(client.getSettings()).rejects.toBeInstanceOf(
			ContractValidationError,
		);
	});
});
