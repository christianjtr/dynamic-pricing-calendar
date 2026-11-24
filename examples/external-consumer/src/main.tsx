import {
	PricingCalendarProvider,
	usePricingCalendar,
} from "@hpc/pricing-calendar";
import {
	type PricesResponse,
	PricesResponseSchema,
	type SettingsResponse,
	SettingsResponseSchema,
} from "@hpc/pricing-calendar/contracts";
import {
	PricingCalendar,
	PricingCalendarUIProvider,
} from "@hpc/pricing-calendar/ui";
import { createRoot } from "react-dom/client";

const range = { from: "2026-11-23", to: "2026-11-23" } as const;
const settings: SettingsResponse = {
	hotel: { timezone: "Pacific/Auckland", locale: "en-NZ", currency: "NZD" },
	rooms: [{ id: "external-room", name: "External room", isReference: true }],
	dateRange: range,
};
const prices: PricesResponse = {
	timezone: "Pacific/Auckland",
	currency: "NZD",
	generatedAt: "2026-11-23T22:30:00.000Z",
	rooms: [
		{
			roomId: "external-room",
			name: "External room",
			days: [
				{
					roomId: "external-room",
					date: range.from,
					status: "auto",
					currency: "NZD",
					price: 189,
					priceInPms: 182,
					recommendedPrice: 197,
					variance: null,
					availability: "available",
					occupancy: null,
					restrictions: [],
					isClosed: false,
					error: null,
				},
			],
		},
	],
};

const fixtureFetch: typeof fetch = async (input) => {
	const url = new URL(
		input instanceof Request ? input.url : String(input),
		"https://pricing.example.test",
	);
	const payload = url.pathname.endsWith("/settings") ? settings : prices;

	return new Response(JSON.stringify(payload), {
		headers: { "Content-Type": "application/json" },
	});
};

function HeadlessProbe() {
	const calendar = usePricingCalendar({ ...range, rooms: ["external-room"] });
	return (
		<p>
			Headless SDK: {calendar.days.length} day(s),{" "}
			{calendar.settings.data?.hotel.currency ?? "loading"}
		</p>
	);
}

function App() {
	const contractsValid =
		SettingsResponseSchema.safeParse(settings).success &&
		PricesResponseSchema.safeParse(prices).success;

	return (
		<PricingCalendarUIProvider>
			<PricingCalendarProvider
				config={{
					baseUrl: "https://pricing.example.test",
					propertyId: "external-consumer",
					fetch: fixtureFetch,
				}}
			>
				<main>
					<h1>External SDK consumer</h1>
					<p>Shared OpenAPI contract valid: {contractsValid ? "yes" : "no"}</p>
					<HeadlessProbe />
					<PricingCalendar {...range} rooms={["external-room"]} />
				</main>
			</PricingCalendarProvider>
		</PricingCalendarUIProvider>
	);
}

const container = document.getElementById("root");
if (!container) {
	throw new Error("Root container was not found");
}

createRoot(container).render(<App />);
