import type { LocalizationSettings as SharedLocalizationSettings } from "@shared/types";
import { z } from "zod";

export const LocalizationSettingsSchema = z.object({
	timezone: z.string(),
	locale: z.string(),
}) satisfies z.ZodType<SharedLocalizationSettings>;

export type LocalizationSettings = z.infer<typeof LocalizationSettingsSchema>;
