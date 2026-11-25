export interface PricingCalendarApiConfig {
	baseUrl?: string;
	propertyId?: string;
}

declare global {
	interface Window {
		pricingCalendarApi?: PricingCalendarApiConfig;
	}
}

export interface ResolvedApiConfig {
	baseUrl: string;
	propertyId: string;
}

export function readApiConfig(): ResolvedApiConfig {
	const config = window.pricingCalendarApi ?? {};
	return {
		baseUrl:
			typeof config.baseUrl === "string"
				? config.baseUrl.replace(/\/+$/, "")
				: "",
		propertyId:
			typeof config.propertyId === "string" && config.propertyId
				? config.propertyId
				: "demo-property",
	};
}
