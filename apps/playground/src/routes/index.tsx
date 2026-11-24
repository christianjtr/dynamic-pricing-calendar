import type { PricesQuery } from "@hpc/contracts";
import {
	createPricingClient,
	PricingCalendarProvider,
	pricingKeys,
} from "@hpc/pricing-calendar";
import {
	PricingCalendar,
	PricingCalendarUIProvider,
} from "@hpc/pricing-calendar/ui";
import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";

const PROPERTY_ID = "playground-property";
const DATE_RANGE = {
	from: "2026-11-23",
	to: "2026-11-29",
} satisfies PricesQuery;

const getServerApiBaseUrl = createServerFn({ method: "GET" }).handler(
	async () => {
		const url = getRequestUrl();
		return `${url.origin}/api`;
	},
);

export const Route = createFileRoute("/")({
	loader: async ({ context }) => {
		const apiBaseUrl =
			typeof window === "undefined" ? await getServerApiBaseUrl() : "/api";
		const client = createPricingClient({
			baseUrl: apiBaseUrl,
			propertyId: PROPERTY_ID,
		});

		await Promise.all([
			context.queryClient.ensureQueryData({
				queryFn: ({ signal }) => client.getSettings(signal),
				queryKey: pricingKeys.settings(PROPERTY_ID),
			}),
			context.queryClient.ensureQueryData({
				queryFn: ({ signal }) => client.getPrices(DATE_RANGE, signal),
				queryKey: pricingKeys.prices(PROPERTY_ID, DATE_RANGE),
			}),
		]);

		return { apiBaseUrl };
	},
	component: PlaygroundPage,
});

function PlaygroundPage() {
	const { queryClient } = Route.useRouteContext();
	const { apiBaseUrl } = Route.useLoaderData();

	return (
		<main className="playground-shell">
			<div className="playground-intro">
				<h1>Headless Pricing Calendar</h1>
				<p>
					Server-rendered playground consuming the public SDK through the
					external-style pricing API.
				</p>
				<Link to="/docs/api">API contract and integration guide</Link>
			</div>
			<PricingCalendarUIProvider>
				<PricingCalendarProvider
					config={{ baseUrl: apiBaseUrl, propertyId: PROPERTY_ID }}
					queryClient={queryClient}
				>
					<PricingCalendar
						{...DATE_RANGE}
						title="Playground pricing calendar"
					/>
				</PricingCalendarProvider>
			</PricingCalendarUIProvider>
		</main>
	);
}
