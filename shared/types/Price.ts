import type { Currency } from "./Currency";

export type PriceDataForDayRoom = {
	error?: boolean;
	error_reason?: string;
	price: number | null;
	price_in_pms: number | null;
};

export type RoomPriceGrid = Record<string, Record<string, PriceDataForDayRoom>>;

export type PricingManifest = {
	data: RoomPriceGrid;
	last_run_pricing_time: string;
};

export type PriceData = {
	currency: Currency;
	prices: PricingManifest;
};
