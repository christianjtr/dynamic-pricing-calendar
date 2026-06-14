import { z } from "zod";
import { LocalizationSettingsSchema } from "./LocalizationSetting";

export const DefaultSettingsSchema = LocalizationSettingsSchema.extend({
	currencyCode: z.string(),
	currencySymbol: z.string(),
});

export type DefaultSettings = z.infer<typeof DefaultSettingsSchema>;
