import {
	type HotelSettings,
	HotelSettingsResponseSchema,
} from "@/types/HotelSettings";
import { z } from "zod";

export const getSettings = async (
	signal?: AbortSignal,
): Promise<HotelSettings> => {
	try {
		const response = await fetch("/api/settings", { signal });

		if (!response.ok) {
			throw new Error(
				`HTTP ${response.status}: Failed to fetch hotel settings`,
			);
		}

		const rawData = await response.json();
		const result = HotelSettingsResponseSchema.safeParse(rawData);

		if (!result.success) {
			console.error(
				"❌ Hotel Settings Mapping Error:",
				z.treeifyError(result.error),
			);
			throw new Error("Invalid hotel settings data received from server");
		}

		return result.data;
	} catch (error: unknown) {
		if (error instanceof DOMException && error.name === "AbortError") {
			throw error;
		}
		if (error instanceof Error) {
			throw error;
		}
		throw new Error("Unknown error occurred while fetching hotel settings");
	}
};
