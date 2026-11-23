import {
	PricesResponseSchema,
	SettingsResponseSchema,
	UpdatePriceResponseSchema,
} from "@hpc/contracts";
import { describe, expect, it } from "vitest";
import { pricesFixture, settingsFixture, updateFixtures } from "./fixtures";
import { handleFixtureRequest } from "./router";

describe("fixture server", () => {
	it("serves settings conforming to the external contract", () => {
		const result = handleFixtureRequest({
			pathname: "/api/settings",
			method: "GET",
			searchParams: new URLSearchParams(),
		});

		expect(result.status).toBe(200);
		expect(SettingsResponseSchema.parse(result.body)).toEqual(settingsFixture);
	});

	it("serves prices conforming to the external contract", () => {
		expect(PricesResponseSchema.parse(pricesFixture)).toEqual(pricesFixture);
	});

	it("serves canonical update responses conforming to the contract", () => {
		expect(
			UpdatePriceResponseSchema.parse(updateFixtures["1001:2026-11-23"]),
		).toEqual(updateFixtures["1001:2026-11-23"]);
	});

	it("filters prices by room and date range without computing values", () => {
		const result = handleFixtureRequest({
			pathname: "/api/prices",
			method: "GET",
			searchParams: new URLSearchParams({
				from: "2026-11-24",
				to: "2026-11-25",
				room: "1001",
			}),
		});

		expect(result.status).toBe(200);
		const body = PricesResponseSchema.parse(result.body);
		expect(body.rooms).toHaveLength(1);
		expect(body.rooms[0]?.roomId).toBe("1001");
		expect(body.rooms[0]?.days.map((day) => day.date)).toEqual([
			"2026-11-24",
			"2026-11-25",
		]);
		expect(body.rooms[0]?.days[0]?.price).toBe(185);
	});

	it("rejects an invalid prices query", () => {
		const result = handleFixtureRequest({
			pathname: "/api/prices",
			method: "GET",
			searchParams: new URLSearchParams({ from: "23-11-2026", to: "nope" }),
		});

		expect(result.status).toBe(400);
		expect(result.body).toMatchObject({
			error: { code: "INVALID_QUERY" },
		});
	});

	it("returns a canonical response for a valid price update", () => {
		const result = handleFixtureRequest({
			pathname: "/api/prices/1001/2026-11-23",
			method: "PATCH",
			searchParams: new URLSearchParams(),
			body: { price: 999 },
		});

		expect(result.status).toBe(200);
		const body = UpdatePriceResponseSchema.parse(result.body);
		expect(body.day.price).toBe(205);
		expect(body.day.status).toBe("manual");
	});

	it("rejects a malformed price update", () => {
		const result = handleFixtureRequest({
			pathname: "/api/prices/1001/2026-11-23",
			method: "PATCH",
			searchParams: new URLSearchParams(),
			body: { price: -1 },
		});

		expect(result.status).toBe(400);
		expect(result.body).toMatchObject({
			error: { code: "INVALID_UPDATE_REQUEST" },
		});
	});

	it("returns 404 for unknown endpoints", () => {
		const result = handleFixtureRequest({
			pathname: "/api/unknown",
			method: "GET",
			searchParams: new URLSearchParams(),
		});

		expect(result.status).toBe(404);
		expect(result.body).toMatchObject({ error: { code: "NOT_FOUND" } });
	});
});
