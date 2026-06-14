import { z } from "zod";

import { type PriceData, PriceDataResponseSchema } from "../../types/Pricing";

export const getPrices = async (
	signal?: AbortSignal,
): Promise<PriceData | null> => {
	try {
		const response = await fetch("/api/prices", { signal });

		if (!response.ok) {
			console.error(`❌ HTTP Error: Status ${response.status} fetching prices`);
			return null;
		}

		const rawData = await response.json();
		const result = PriceDataResponseSchema.safeParse(rawData);

		if (!result.success) {
			console.error(
				"❌ Pricing Data Mapping Error:",
				z.treeifyError(result.error),
			);
			return null;
		}

		return result.data;
	} catch (error: unknown) {
		if (error instanceof DOMException && error.name === "AbortError") {
			return null;
		}
		console.error("❌ Fatal System Error:", error);
		return null;
	}
};
