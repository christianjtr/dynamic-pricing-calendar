import {
	ApiErrorSchema,
	apiPaths,
	GetPricesQueryParams,
	GetSettingsHeader,
	type PricesQuery,
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

type MaybePromise<T> = T | Promise<T>;

export interface PricingClientConfig {
	baseUrl: string;
	propertyId: string;
	fetch?: typeof fetch;
	headers?:
		| Record<string, string>
		| (() => MaybePromise<Record<string, string>>);
	credentials?: RequestCredentials;
}

export interface PricingClient {
	readonly propertyId: string;
	getSettings(signal?: AbortSignal): Promise<SettingsResponse>;
	getPrices(query: PricesQuery, signal?: AbortSignal): Promise<PricesResponse>;
	updatePrice(
		roomId: string,
		date: string,
		request: UpdatePriceRequest,
		signal?: AbortSignal,
	): Promise<UpdatePriceResponse>;
}

export class PricingApiError extends Error {
	readonly status: number;
	readonly code: string;
	readonly details?: Record<string, unknown>;

	constructor(
		status: number,
		payload: {
			error: {
				code: string;
				message: string;
				details?: Record<string, unknown>;
			};
		},
	) {
		super(payload.error.message);
		this.name = "PricingApiError";
		this.status = status;
		this.code = payload.error.code;
		this.details = payload.error.details;
	}
}

const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/+$/, "");

const createRequestInit = async (
	config: PricingClientConfig,
	method: string,
	options?: { body?: unknown; signal?: AbortSignal },
): Promise<RequestInit> => {
	const extraHeaders =
		typeof config.headers === "function"
			? await config.headers()
			: config.headers;
	const body =
		options?.body === undefined ? undefined : JSON.stringify(options.body);

	return {
		method,
		headers: {
			Accept: "application/json",
			...(body ? { "Content-Type": "application/json" } : {}),
			...extraHeaders,
			"x-property-id": config.propertyId,
		},
		credentials: config.credentials,
		signal: options?.signal,
		body,
	};
};

const requestJson = async (
	fetchFn: typeof fetch,
	url: string,
	init: RequestInit,
): Promise<unknown> => {
	const response = await fetchFn(url, init);
	if (!response.ok) {
		let payload: unknown = null;
		try {
			payload = await response.json();
		} catch {
			payload = null;
		}

		const parsed = ApiErrorSchema.safeParse(payload);
		if (parsed.success) {
			throw new PricingApiError(response.status, parsed.data);
		}
		throw new Error(
			`Pricing API request failed with status ${response.status}`,
		);
	}
	return response.json();
};

export function createPricingClient(
	config: PricingClientConfig,
): PricingClient {
	const baseUrl = normalizeBaseUrl(config.baseUrl);
	const fetchFn = config.fetch ?? globalThis.fetch.bind(globalThis);
	const propertyId = GetSettingsHeader.parse({
		"x-property-id": config.propertyId,
	})["x-property-id"];
	const clientConfig = { ...config, propertyId };

	return {
		propertyId,
		async getSettings(signal) {
			const json = await requestJson(
				fetchFn,
				`${baseUrl}${apiPaths.settings}`,
				await createRequestInit(clientConfig, "GET", { signal }),
			);
			return parseContract(SettingsResponseSchema, json, "settings");
		},
		async getPrices(query, signal) {
			const params = GetPricesQueryParams.parse({
				from: query.from,
				to: query.to,
				room: query.rooms,
			});
			const json = await requestJson(
				fetchFn,
				`${baseUrl}${apiPaths.prices({
					from: params.from,
					to: params.to,
					rooms: params.room,
				})}`,
				await createRequestInit(clientConfig, "GET", { signal }),
			);
			return parseContract(PricesResponseSchema, json, "prices");
		},
		async updatePrice(roomId, date, request, signal) {
			const params = UpdatePriceParams.parse({ roomId, date });
			const validated = UpdatePriceBody.parse(request);
			const json = await requestJson(
				fetchFn,
				`${baseUrl}${apiPaths.price(params.roomId, params.date)}`,
				await createRequestInit(clientConfig, "PATCH", {
					body: validated,
					signal,
				}),
			);
			return parseContract(UpdatePriceResponseSchema, json, "price update");
		},
	};
}
