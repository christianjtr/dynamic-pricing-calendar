import { z } from "zod";
import { CurrencyCodeSchema, IsoDateSchema } from "./common";

export const RoomSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	isReference: z.boolean(),
});

export const SettingsResponseSchema = z.object({
	hotel: z.object({
		timezone: z.string().min(1),
		locale: z.string().min(1),
		currency: CurrencyCodeSchema,
	}),
	rooms: z.array(RoomSchema).min(1),
	dateRange: z.object({
		from: IsoDateSchema,
		to: IsoDateSchema,
	}),
});

export type Room = z.infer<typeof RoomSchema>;
export type SettingsResponse = z.infer<typeof SettingsResponseSchema>;
