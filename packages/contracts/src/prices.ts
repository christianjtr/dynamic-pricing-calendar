import { z } from "zod";
import { GetPricesQueryParams } from "./generated/operations.zod";
import { DayVariance as GeneratedDayVariance } from "./generated/schemas";

export type {
	DayAvailability,
	DayPrice,
	DayVariance,
	PriceError,
	PriceStatus,
	PricesResponse,
	RoomPrices,
	UpdatePriceRequest,
	UpdatePriceResponse,
} from "./generated/schemas";
export {
	DayAvailability as DayAvailabilitySchema,
	DayPrice as DayPriceSchema,
	DayVariance as DayVarianceSchema,
	PriceError as PriceErrorSchema,
	PriceStatus as PriceStatusSchema,
	PricesResponse as PricesResponseSchema,
	RoomPrices as RoomPricesSchema,
	UpdatePriceRequest as UpdatePriceRequestSchema,
	UpdatePriceResponse as UpdatePriceResponseSchema,
} from "./generated/schemas";

export type VarianceDirection = z.infer<
	typeof GeneratedDayVariance
>["direction"];
export type VarianceSeverity = z.infer<typeof GeneratedDayVariance>["severity"];
export const VarianceDirectionSchema = GeneratedDayVariance.shape.direction;
export const VarianceSeveritySchema = GeneratedDayVariance.shape.severity;

// The SDK uses `rooms`; the wire contract serializes it as repeated `room` parameters.
export const PricesQuerySchema = z.object({
	from: GetPricesQueryParams.shape.from,
	to: GetPricesQueryParams.shape.to,
	rooms: GetPricesQueryParams.shape.room,
});
export type PricesQuery = z.infer<typeof PricesQuerySchema>;

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
		`/prices/${encodeURIComponent(roomId)}/${encodeURIComponent(date)}`,
} as const;
