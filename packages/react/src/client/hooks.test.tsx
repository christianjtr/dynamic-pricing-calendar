import type {
	DayPrice,
	PricesResponse,
	SettingsResponse,
	UpdatePriceResponse,
} from "@hpc/contracts";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { replaceDay } from "./cache";
import { usePrices, useSettings, useUpdatePrice } from "./hooks";
import { PricingCalendarProvider } from "./provider";

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

const jsonResponse = (body: unknown) =>
	({ ok: true, status: 200, json: async () => body }) as Response;

const useFixture = () => ({
	pricesQuery: usePrices({
		from: "2026-11-23",
		to: "2026-11-24",
		rooms: ["1001"],
	}),
	updatePrice: useUpdatePrice(),
});

describe("pricing query hooks", () => {
	it("loads settings through the provider client", async () => {
		const fetchMock = vi.fn(async () => jsonResponse(settings));
		const wrapper = ({ children }: { children: ReactNode }) => (
			<PricingCalendarProvider
				config={{
					baseUrl: "https://be.test",
					propertyId: "hotel-1",
					fetch: fetchMock as unknown as typeof fetch,
				}}
			>
				{children}
			</PricingCalendarProvider>
		);

		const { result } = renderHook(() => useSettings(), { wrapper });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data?.hotel.currency).toBe("NZD");
	});

	it("shows pending state and replaces only the canonical day after a write", async () => {
		let currentPrices = prices;
		let resolveUpdate: ((response: Response) => void) | undefined;
		const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
			const url = String(input);
			if (url.endsWith("/settings")) {
				return jsonResponse(settings);
			}
			if (url.includes("/prices/")) {
				currentPrices = replaceDay(prices, update.day);
				return new Promise<Response>((resolve) => {
					resolveUpdate = resolve;
				});
			}
			return jsonResponse(currentPrices);
		});
		const wrapper = ({ children }: { children: ReactNode }) => (
			<PricingCalendarProvider
				config={{
					baseUrl: "https://be.test",
					propertyId: "hotel-1",
					fetch: fetchMock as unknown as typeof fetch,
				}}
			>
				{children}
			</PricingCalendarProvider>
		);
		const { result } = renderHook(useFixture, { wrapper });
		await waitFor(() =>
			expect(result.current.pricesQuery.isSuccess).toBe(true),
		);
		expect(result.current.pricesQuery.data?.rooms[0]?.days[0]?.price).toBe(189);

		act(() => {
			result.current.updatePrice.mutate({
				roomId: "1001",
				date: "2026-11-23",
				price: 999,
			});
		});

		await waitFor(() => expect(resolveUpdate).toBeDefined());
		expect(result.current.updatePrice.isPending).toBe(true);

		await act(async () => {
			resolveUpdate?.(jsonResponse(update));
		});

		await waitFor(() =>
			expect(result.current.pricesQuery.data?.rooms[0]?.days[0]?.price).toBe(
				205,
			),
		);
		expect(result.current.pricesQuery.data?.rooms[0]?.days[0]?.status).toBe(
			"manual",
		);
		expect(result.current.updatePrice.isSuccess).toBe(true);
	});
});
