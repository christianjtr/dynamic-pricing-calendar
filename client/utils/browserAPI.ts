export const SUPPORTED_LOCALES = ["en-NZ", "en-GB", "en-US"] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export interface RegionalCurrency {
	code: string;
	symbol: string;
}

export const getBrowserLocale = (): string => {
	const hasNavigatorLanguage =
		typeof navigator !== "undefined" && navigator.language;
	return hasNavigatorLanguage ? navigator.language.split("-")[0] || "en" : "en";
};

export const getBrowserTimezone = (): string => {
	const browserTimezone =
		typeof Intl !== "undefined"
			? Intl.DateTimeFormat().resolvedOptions().timeZone
			: "UTC";
	return browserTimezone;
};

export const getCurrencyFromLocale = (localeStr: string): RegionalCurrency => {
	try {
		const formatter = new Intl.NumberFormat(localeStr, {
			style: "currency",
			currency: "USD",
		});
		const code = formatter.resolvedOptions().currency || "USD";

		const symbolMap: Record<string, string> = {
			"en-NZ": "NZ$",
			"en-GB": "£",
			"en-US": "$",
		};
		return {
			code,
			symbol: symbolMap[localeStr] || "$",
		};
	} catch {
		return { code: "USD", symbol: "$" };
	}
};
