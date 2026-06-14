import type {
	PriceDataForDayRoom as SharedPriceDataForDayRoom,
	PricingManifest as SharedPricingManifest,
} from "@shared/types";
import { toCamelCaseKeys } from "es-toolkit/object";
import { z } from "zod";
import { CurrencySchema } from "./Currency";

const PriceDataForDayRoomSchema = z.object({
	error: z.boolean().optional(),
	error_reason: z.string().optional(),
	price: z.number().nullable(),
	price_in_pms: z.number().nullable(),
}) satisfies z.ZodType<SharedPriceDataForDayRoom>;

export const PriceDataResponseSchema = z
	.object({
		currency: CurrencySchema,
		prices: z.object({
			data: z.record(
				z.string(),
				z.record(z.string(), PriceDataForDayRoomSchema),
			),
			last_run_pricing_time: z.string(),
		}) satisfies z.ZodType<SharedPricingManifest>,
	})
	.transform((raw) => toCamelCaseKeys(raw));

export type PriceData = z.infer<typeof PriceDataResponseSchema>;

export type RawPriceDataForDayRoom = z.infer<typeof PriceDataForDayRoomSchema>;

export type RoomInfo = {
	price: RawPriceDataForDayRoom["price"];
	priceInPms: RawPriceDataForDayRoom["price_in_pms"];
	error?: RawPriceDataForDayRoom["error"];
	errorReason?: RawPriceDataForDayRoom["error_reason"];
};

export interface DayPriceItem extends RoomInfo {
	dateKey: string;
	dayNumber: number;
	currencySymbol: string;
}
