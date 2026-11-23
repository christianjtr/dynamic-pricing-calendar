import { z } from "zod";

export const IsoDateSchema = z.iso.date();
export const IsoDateTimeSchema = z.iso.datetime();
export const CurrencyCodeSchema = z.string().regex(/^[A-Z]{3}$/);

export const ApiErrorSchema = z.object({
	error: z.object({
		code: z.string().min(1),
		message: z.string().min(1),
		details: z.record(z.string(), z.unknown()).optional(),
	}),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

export class ContractValidationError extends Error {
	readonly label: string;
	readonly cause: z.ZodError;

	constructor(label: string, cause: z.ZodError) {
		super(`Invalid ${label} payload`);
		this.name = "ContractValidationError";
		this.label = label;
		this.cause = cause;
	}
}

export function parseContract<S extends z.ZodType>(
	schema: S,
	value: unknown,
	label: string,
): z.output<S> {
	const result = schema.safeParse(value);
	if (!result.success) {
		throw new ContractValidationError(label, result.error);
	}
	return result.data;
}
