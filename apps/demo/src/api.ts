import {
	ApiErrorSchema,
	apiPaths,
	type PricesQuery,
	PricesQuerySchema,
	type PricesResponse,
	PricesResponseSchema,
	parseContract,
	type SettingsResponse,
	SettingsResponseSchema,
	UpdatePriceBody,
	UpdatePriceParams,
	type UpdatePriceRequest,
	type UpdatePriceResponse,
	UpdatePriceResponseSchema,
} from "@hpc/contracts";
import { fixtureFetch } from "./fixtureFetch";

const propertyId = "demo-property";

// shortcut: the demo calls its own fixture router; swap this fetch for a real backend when one exists.
async function requestJson(path: string, init: RequestInit): Promise<unknown> {
	const response = await fixtureFetch(`/api${path}`, {
		...init,
		headers: {
			Accept: "application/json",
			"x-property-id": propertyId,
			...init.headers,
		},
	});

	if (!response.ok) {
		const payload: unknown = await response.json().catch(() => null);
		const parsed = ApiErrorSchema.safeParse(payload);
		if (parsed.success) {
			throw new Error(parsed.data.error.message);
		}
		throw new Error(
			`Pricing API request failed with status ${response.status}`,
		);
	}

	return response.json();
}

export const pricingClient = {
	propertyId,
	async getSettings(signal?: AbortSignal): Promise<SettingsResponse> {
		const json = await requestJson(apiPaths.settings, {
			method: "GET",
			signal,
		});
		return parseContract(SettingsResponseSchema, json, "settings");
	},
	async getPrices(
		query: PricesQuery,
		signal?: AbortSignal,
	): Promise<PricesResponse> {
		const params = PricesQuerySchema.parse(query);
		const json = await requestJson(apiPaths.prices(params), {
			method: "GET",
			signal,
		});
		return parseContract(PricesResponseSchema, json, "prices");
	},
	async updatePrice(
		roomId: string,
		date: string,
		request: UpdatePriceRequest,
		signal?: AbortSignal,
	): Promise<UpdatePriceResponse> {
		const params = UpdatePriceParams.parse({ roomId, date });
		const body = UpdatePriceBody.parse(request);
		const json = await requestJson(apiPaths.price(params.roomId, params.date), {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
			signal,
		});
		return parseContract(UpdatePriceResponseSchema, json, "price update");
	},
};
