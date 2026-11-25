import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readApiConfig } from "./apiConfig";

beforeEach(() => {
	vi.stubGlobal("window", {});
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("API config", () => {
	it("defaults to fixture mode", () => {
		expect(readApiConfig()).toEqual({
			baseUrl: "",
			propertyId: "demo-property",
		});
	});

	it("normalizes a configured base URL and property id", () => {
		vi.stubGlobal("window", {
			pricingCalendarApi: {
				baseUrl: "https://api.example.com/v1/",
				propertyId: "hotel-42",
			},
		});

		expect(readApiConfig()).toEqual({
			baseUrl: "https://api.example.com/v1",
			propertyId: "hotel-42",
		});
	});

	it("ignores non-string configuration values", () => {
		vi.stubGlobal("window", {
			pricingCalendarApi: { baseUrl: 7, propertyId: "" },
		});

		expect(readApiConfig()).toEqual({
			baseUrl: "",
			propertyId: "demo-property",
		});
	});
});
