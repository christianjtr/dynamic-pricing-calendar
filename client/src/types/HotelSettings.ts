import type {
	DerivedRoom,
	HotelInventory,
	RoomReference,
	HotelSettings as SharedHotelSettings,
} from "@shared/types";
import { z } from "zod";

import { LocalizationSettingsSchema } from "./LocalizationSetting";

export const HotelSettingsResponseSchema = z.object({
	hotel: LocalizationSettingsSchema,
	rooms: z.object({
		derived: z.record(
			z.string(),
			z.object({
				name: z.string(),
			}) satisfies z.ZodType<DerivedRoom>,
		),
		reference: z.object({
			id: z.number(),
			name: z.string(),
		}) satisfies z.ZodType<RoomReference>,
	}) satisfies z.ZodType<HotelInventory>,
}) satisfies z.ZodType<SharedHotelSettings>;

export type HotelSettings = z.infer<typeof HotelSettingsResponseSchema>;
