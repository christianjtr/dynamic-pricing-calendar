import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	apiError,
	pricesFixture,
	settingsFixture,
	updateFixtures,
} from "../../../../apps/demo/src/fixtures/fixtures";
import { PricingCalendarProvider } from "../client";
import { PricingCalendar } from "./PricingCalendar";
import { PricingCalendarUIProvider } from "./Provider";

const jsonResponse = (body: unknown, status = 200) =>
	({
		ok: status < 400,
		status,
		json: async () => body,
	}) as Response;

describe("PricingCalendar", () => {
	const fetchMock = vi.fn(async (input: string | URL | Request) => {
		const url = new URL(input.toString(), "https://be.test/");
		const parts = url.pathname.split("/").filter(Boolean);

		if (url.pathname.endsWith("/settings")) {
			return jsonResponse(settingsFixture);
		}
		if (parts.at(-3) === "prices") {
			const key = `${parts.at(-2)}:${parts.at(-1)}`;
			const body = updateFixtures[key] ?? apiError("NOT_FOUND", "Unknown day");
			return jsonResponse(body, updateFixtures[key] ? 200 : 404);
		}
		if (url.pathname.endsWith("/prices")) {
			return jsonResponse(pricesFixture);
		}
		return jsonResponse(apiError("NOT_FOUND", "Unknown route"), 404);
	});

	beforeEach(() => {
		fetchMock.mockClear();
	});

	it("renders backend data in a rooms by dates grid", async () => {
		render(
			<PricingCalendarUIProvider>
				<PricingCalendarProvider
					config={{
						baseUrl: "https://be.test/backend/",
						propertyId: "prop-1",
						fetch: fetchMock,
					}}
				>
					<PricingCalendar from="2026-11-23" to="2026-11-24" />
				</PricingCalendarProvider>
			</PricingCalendarUIProvider>,
		);

		await waitFor(() =>
			expect(screen.getAllByText("Single Room").length).toBeGreaterThan(0),
		);
		expect(screen.getAllByRole("columnheader")).toHaveLength(3);
		expect(
			screen.getByRole("button", {
				name: /1001, 2026-11-23, Automated, NZ\$189, Restricted: min-stay:2, Occupancy: 72%, Variance: \+4\.2%/,
			}),
		).toBeTruthy();
		expect(
			screen.getByRole("button", { name: /1001, 2026-11-24, Automated/ }),
		).toBeTruthy();
		expect(
			screen.getAllByText("Restricted: min-stay:2").length,
		).toBeGreaterThan(0);
		expect(screen.getAllByText("Occupancy: 72%").length).toBeGreaterThan(0);
	});

	it("shows closed dates with text indicators", async () => {
		render(
			<PricingCalendarUIProvider>
				<PricingCalendarProvider
					config={{
						baseUrl: "https://be.test/backend/",
						propertyId: "prop-1",
						fetch: fetchMock,
					}}
				>
					<PricingCalendar from="2026-11-26" to="2026-11-26" />
				</PricingCalendarProvider>
			</PricingCalendarUIProvider>,
		);

		const cell = await screen.findByRole("button", {
			name: /1001, 2026-11-26, Closed, .*Closed date/,
		});
		expect(cell).toBeTruthy();
		expect(screen.getAllByText("Closed date").length).toBeGreaterThan(0);
	});

	it("preserves long backend indicator text in the day cell", async () => {
		const longRestriction = `restriction:${"x".repeat(80)}`;
		const pricesWithLongRestriction = {
			...pricesFixture,
			rooms: pricesFixture.rooms.map((room, roomIndex) =>
				roomIndex === 0
					? {
							...room,
							days: room.days.map((day, dayIndex) =>
								dayIndex === 0
									? { ...day, restrictions: [longRestriction] }
									: day,
							),
						}
					: room,
			),
		};
		const fetchWithLongRestriction = vi.fn(
			async (input: string | URL | Request) => {
				const url = new URL(input.toString(), "https://be.test/");
				return jsonResponse(
					url.pathname.endsWith("/settings")
						? settingsFixture
						: pricesWithLongRestriction,
				);
			},
		);

		render(
			<PricingCalendarUIProvider>
				<PricingCalendarProvider
					config={{
						baseUrl: "https://be.test/backend/",
						propertyId: "prop-1",
						fetch: fetchWithLongRestriction,
					}}
				>
					<PricingCalendar from="2026-11-23" to="2026-11-23" />
				</PricingCalendarProvider>
			</PricingCalendarUIProvider>,
		);

		await screen.findByRole("button", {
			name: new RegExp(`Restricted: ${longRestriction}`),
		});
		expect(screen.getByText(`Restricted: ${longRestriction}`)).toBeTruthy();
	});

	it("saves a selected day through the backend and shows the canonical response", async () => {
		render(
			<PricingCalendarUIProvider>
				<PricingCalendarProvider
					config={{
						baseUrl: "https://be.test/backend/",
						propertyId: "prop-1",
						fetch: fetchMock,
					}}
				>
					<PricingCalendar from="2026-11-23" to="2026-11-24" />
				</PricingCalendarProvider>
			</PricingCalendarUIProvider>,
		);

		const cell = await screen.findByRole("button", {
			name: /1001, 2026-11-23, Automated/,
		});
		fireEvent.click(cell);

		fireEvent.change(screen.getByLabelText(/Price \(NZD\)/), {
			target: { value: "205" },
		});
		fireEvent.click(screen.getByRole("button", { name: "Save price" }));

		await waitFor(() =>
			expect(fetchMock).toHaveBeenCalledWith(
				expect.stringContaining("/prices/1001/2026-11-23"),
				expect.objectContaining({ method: "PATCH" }),
			),
		);
		await waitFor(() =>
			expect(screen.getByText(/Canonical price/)).toBeTruthy(),
		);
	});
});
