import {
	type HotelSettings,
	HotelSettingsResponseSchema,
} from "@/types/HotelSettings";
import { z } from "zod";

export const getSettings = async (
	signal?: AbortSignal,
): Promise<HotelSettings | null> => {
	try {
		const response = await fetch("/api/settings", { signal });

		if (!response.ok) {
			console.error(
				`❌ HTTP Error: Status ${response.status} fetching settings`,
			);
			return null;
		}

		const rawData = await response.json();
		const result = HotelSettingsResponseSchema.safeParse(rawData);

		if (!result.success) {
			console.error(
				"❌ Hotel Settings Mapping Error:",
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
