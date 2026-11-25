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
import { readApiConfig } from "./lib/apiConfig";

const config = readApiConfig();

async function requestJson(path: string, init: RequestInit): Promise<unknown> {
	const url = config.baseUrl ? `${config.baseUrl}${path}` : `/api${path}`;
	const options: RequestInit = {
		...init,
		headers: {
			Accept: "application/json",
			"x-property-id": config.propertyId,
			...init.headers,
		},
	};
	const response = config.baseUrl
		? await fetch(url, options)
		: await fixtureFetch(url, options);

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
	propertyId: config.propertyId,
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
