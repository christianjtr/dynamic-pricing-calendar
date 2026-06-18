import type { DayPriceItem } from "@/types/Pricing";

export interface ComputedDayBusinessState {
	hasData: boolean;
	isError: boolean;
	errorText: string;
	rpgValue: string;
	pmsValue: string;
	variancePercentage: number;
	hasHighDisparity: boolean;
}

export function computeDayRatesBusinessState(
	dayData: DayPriceItem | null | undefined,
	isCurrentMonth: boolean,
): ComputedDayBusinessState {
	if (!dayData || dayData.price === null || dayData.priceInPms === null) {
		return {
			hasData: false,
			isError: false,
			errorText: "",
			rpgValue: "—",
			pmsValue: "—",
			variancePercentage: 0,
			hasHighDisparity: false,
		};
	}

	if (dayData.error) {
		const errorReason = dayData.errorReason || "NO_AVAILABLE_MARKET_DATA";
		const displayText =
			errorReason === "NO_AVAILABLE_MARKET_DATA"
				? "NO MARKET DATA"
				: "PRICING ERROR";

		return {
			hasData: false,
			isError: true,
			errorText: displayText,
			rpgValue: "—",
			pmsValue: "—",
			variancePercentage: 0,
			hasHighDisparity: false,
		};
	}

	const { price, priceInPms } = dayData;
	const diff = priceInPms > 0 ? ((price - priceInPms) / priceInPms) * 100 : 0;

	const hasHighDisparity = Math.abs(diff) >= 4 && isCurrentMonth;

	return {
		hasData: true,
		isError: false,
		errorText: "",
		rpgValue: String(price),
		pmsValue: String(priceInPms),
		variancePercentage: diff,
		hasHighDisparity,
	};
}
