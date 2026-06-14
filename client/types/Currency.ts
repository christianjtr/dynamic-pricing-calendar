import type { Currency as SharedCurrency } from "@shared/types";
import { z } from "zod";

export const CurrencySchema = z.object({
	symbol: z.string(),
	code: z.string(),
}) satisfies z.ZodType<SharedCurrency>;

export type Currency = z.infer<typeof CurrencySchema>;
