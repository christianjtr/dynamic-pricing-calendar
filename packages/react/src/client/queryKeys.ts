import type { PricesQuery } from "@hpc/contracts";

export const pricingKeys = {
	all: () => ["hpc", "pricing"] as const,
	settings: (propertyId: string) =>
		[...pricingKeys.all(), "settings", propertyId] as const,
	pricesAll: (propertyId: string) =>
		[...pricingKeys.all(), "prices", propertyId] as const,
	prices: (propertyId: string, query: PricesQuery) =>
		[
			...pricingKeys.pricesAll(propertyId),
			query.from,
			query.to,
			[...(query.rooms ?? [])].sort(),
		] as const,
};
