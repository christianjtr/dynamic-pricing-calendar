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
	type UpdatePriceRequest,
	UpdatePriceRequestSchema,
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
			"x-property-id": config.propertyId,
			...extraHeaders,
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

	return {
		propertyId: config.propertyId,
		async getSettings(signal) {
			const json = await requestJson(
				fetchFn,
				`${baseUrl}${apiPaths.settings}`,
				await createRequestInit(config, "GET", { signal }),
			);
			return parseContract(SettingsResponseSchema, json, "settings");
		},
		async getPrices(query, signal) {
			const validated = PricesQuerySchema.parse(query);
			const json = await requestJson(
				fetchFn,
				`${baseUrl}${apiPaths.prices(validated)}`,
				await createRequestInit(config, "GET", { signal }),
			);
			return parseContract(PricesResponseSchema, json, "prices");
		},
		async updatePrice(roomId, date, request, signal) {
			const validated = UpdatePriceRequestSchema.parse(request);
			const json = await requestJson(
				fetchFn,
				`${baseUrl}${apiPaths.price(roomId, date)}`,
				await createRequestInit(config, "PATCH", {
					body: validated,
					signal,
				}),
			);
			return parseContract(UpdatePriceResponseSchema, json, "price update");
		},
	};
}
