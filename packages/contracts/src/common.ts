import type { z } from "zod";
import {
	ApiError as ApiErrorSchema,
	CurrencyCode as CurrencyCodeSchema,
	IsoDate as IsoDateSchema,
	IsoDateTime as IsoDateTimeSchema,
} from "./generated/schemas";

export type { ApiError } from "./generated/schemas";
export { ApiErrorSchema, CurrencyCodeSchema, IsoDateSchema, IsoDateTimeSchema };

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
