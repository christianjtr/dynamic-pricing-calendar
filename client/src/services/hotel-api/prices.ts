import { z } from "zod";

import { type PriceData, PriceDataResponseSchema } from "@/types/Pricing";

export const getPrices = async (signal?: AbortSignal): Promise<PriceData> => {
	try {
		const response = await fetch("/api/prices", { signal });

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: Failed to fetch pricing data`);
		}

		const rawData = await response.json();
		const result = PriceDataResponseSchema.safeParse(rawData);

		if (!result.success) {
			console.error(
				"❌ Pricing Data Mapping Error:",
				z.treeifyError(result.error),
			);
			throw new Error("Invalid pricing data received from server");
		}

		return result.data;
	} catch (error: unknown) {
		if (error instanceof DOMException && error.name === "AbortError") {
			throw error;
		}
		if (error instanceof Error) {
			throw error;
		}
		throw new Error("Unknown error occurred while fetching prices");
	}
};
