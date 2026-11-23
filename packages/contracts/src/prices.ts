import { z } from "zod";
import { CurrencyCodeSchema, IsoDateSchema, IsoDateTimeSchema } from "./common";

export const PriceStatusSchema = z.enum([
	"auto",
	"manual",
	"closed",
	"unavailable",
]);
export const VarianceDirectionSchema = z.enum(["up", "down", "flat"]);
export const VarianceSeveritySchema = z.enum(["low", "medium", "high"]);
export const DayAvailabilitySchema = z.enum([
	"available",
	"restricted",
	"sold_out",
]);

export const PriceErrorSchema = z.object({
	code: z.string().min(1),
	message: z.string().min(1),
});

export const DayVarianceSchema = z.object({
	value: z.number(),
	direction: VarianceDirectionSchema,
	severity: VarianceSeveritySchema,
	label: z.string().min(1),
});

export const DayPriceSchema = z.object({
	roomId: z.string().min(1),
	date: IsoDateSchema,
	status: PriceStatusSchema,
	currency: CurrencyCodeSchema,
	price: z.number().nonnegative(),
	priceInPms: z.number().nonnegative().nullable(),
	recommendedPrice: z.number().nonnegative().nullable(),
	variance: DayVarianceSchema.nullable(),
	availability: DayAvailabilitySchema,
	occupancy: z.number().min(0).max(1).nullable(),
	restrictions: z.array(z.string().min(1)),
	isClosed: z.boolean(),
	error: PriceErrorSchema.nullable(),
});

export const RoomPricesSchema = z.object({
	roomId: z.string().min(1),
	name: z.string().min(1),
	days: z.array(DayPriceSchema),
});

export const PricesResponseSchema = z.object({
	timezone: z.string().min(1),
	currency: CurrencyCodeSchema,
	generatedAt: IsoDateTimeSchema,
	rooms: z.array(RoomPricesSchema),
});

export const PricesQuerySchema = z.object({
	from: IsoDateSchema,
	to: IsoDateSchema,
	rooms: z.array(z.string().min(1)).optional(),
});

export const UpdatePriceRequestSchema = z.object({
	price: z.number().nonnegative(),
	reason: z.string().max(500).optional(),
});

export const UpdatePriceResponseSchema = z.object({
	day: DayPriceSchema,
	acceptedAt: IsoDateTimeSchema,
});

export type PriceStatus = z.infer<typeof PriceStatusSchema>;
export type VarianceDirection = z.infer<typeof VarianceDirectionSchema>;
export type VarianceSeverity = z.infer<typeof VarianceSeveritySchema>;
export type DayAvailability = z.infer<typeof DayAvailabilitySchema>;
export type PriceError = z.infer<typeof PriceErrorSchema>;
export type DayVariance = z.infer<typeof DayVarianceSchema>;
export type DayPrice = z.infer<typeof DayPriceSchema>;
export type RoomPrices = z.infer<typeof RoomPricesSchema>;
export type PricesResponse = z.infer<typeof PricesResponseSchema>;
export type PricesQuery = z.infer<typeof PricesQuerySchema>;
export type UpdatePriceRequest = z.infer<typeof UpdatePriceRequestSchema>;
export type UpdatePriceResponse = z.infer<typeof UpdatePriceResponseSchema>;

export const apiPaths = {
	settings: "/settings",
	prices: (query: PricesQuery) => {
		const params = new URLSearchParams({ from: query.from, to: query.to });
		for (const roomId of query.rooms ?? []) {
			params.append("room", roomId);
		}
		return `/prices?${params.toString()}`;
	},
	price: (roomId: string, date: string) =>
		`/prices/${encodeURIComponent(roomId)}/${date}`,
} as const;
