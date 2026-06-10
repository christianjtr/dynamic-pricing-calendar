import { format } from "date-fns";
import { eventHandler, getRequestURL } from "vinxi/http";
import type { PriceData, SettingsData } from "../types";

export default eventHandler(async (event) => {
	const info = getRequestURL(event);
	if (info.pathname.startsWith("/api/prices")) {
		const startDate = new Date();
		const data: PriceData = {
			currency: {
				symbol: "NZ$",
				code: "NZD",
			},
			prices: {
				data: {},
				last_run_pricing_time: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
			},
		};

		// Generate data for 365 days
		for (let i = 0; i < 365; i++) {
			const currentDate = new Date(startDate);
			currentDate.setDate(currentDate.getDate() + i);
			const dateKey = format(currentDate, "yyyy-MM-dd");

			const generatePriceData = (basePrice: number) => {
				const isError = Math.random() > 0.8;
				const pmsPrice = basePrice;
				const shouldVaryPrice = Math.random() > 0.5; // 50% chance of having a price variation
				const priceVariation = shouldVaryPrice
					? Math.random() > 0.5
						? 1.04
						: 0.96
					: 1; // When varying, 50% chance of 4% up or down
				const finalPrice = Math.round(basePrice * priceVariation);

				return {
					error: isError,
					error_reason: isError ? "NO_AVAILABLE_MARKET_DATA" : undefined,
					price: isError ? null : finalPrice,
					price_in_pms: isError ? null : pmsPrice,
				};
			};

			data.prices.data[dateKey] = {
				"1001": generatePriceData(Math.floor(Math.random() * 100) + 100), // Fixed base price for Single Room
				"1002": generatePriceData(Math.floor(Math.random() * 120) + 100), // Fixed base price for Double Room
				"1003": generatePriceData(Math.floor(Math.random() * 140) + 100), // Fixed base price for Family Room
			};
		}

		return data;
	}

	if (info.pathname.startsWith("/api/settings")) {
		const data: SettingsData = {
			hotel: {
				timezone: "Pacific/Auckland",
				locale: "en-NZ",
			},
			rooms: {
				derived: {
					"1002": {
						name: "Double Room",
					},
					"1003": {
						name: "Family Room",
					},
				},
				reference: {
					id: 1001,
					name: "Single Room",
				},
			},
		};

		return data;
	}
});
