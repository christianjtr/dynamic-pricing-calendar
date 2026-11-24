# Integration guide

The SDK transports and validates backend data. It does not calculate prices, variance, recommendations, availability, occupancy or restrictions. Render the fields returned by the backend and treat the response to a price update as the only canonical value.

The package is currently workspace-only. Consumer apps in this repository depend on it with `workspace:*`. React 19 and TanStack Query 5 are required peers; Mantine 9 is only needed for `@hpc/pricing-calendar/ui`.

## Ready-to-use UI

```tsx
import { PricingCalendarProvider } from "@hpc/pricing-calendar";
import {
	PricingCalendar,
	PricingCalendarUIProvider,
} from "@hpc/pricing-calendar/ui";

const RANGE = {
	from: "2026-11-23",
	to: "2026-11-29",
} as const;

interface AppProps {
	token: string;
}

export function App({ token }: AppProps) {
	return (
		<PricingCalendarUIProvider>
			<PricingCalendarProvider
				config={{
					baseUrl: "https://pricing.example.com",
					propertyId: "property-1001",
					headers: () => ({ Authorization: `Bearer ${token}` }),
					credentials: "include",
				}}
			>
				<PricingCalendar {...RANGE} title="Pricing calendar" />
			</PricingCalendarProvider>
		</PricingCalendarUIProvider>
	);
}
```

`PricingCalendar` accepts `from`, `to`, optional `rooms`, optional `roomId` and optional `title`. Backend configuration belongs on `PricingCalendarProvider`; there is no implicit `/api` base path.

## Headless integration

```tsx
import {
	PricingCalendarProvider,
	usePricingCalendar,
} from "@hpc/pricing-calendar";

const RANGE = {
	from: "2026-11-23",
	to: "2026-11-29",
} as const;

function MyCalendar() {
	const {
		settings,
		prices,
		rooms,
		activeRoomId,
		setSelectedRoomId,
		days,
		updatePrice,
	} = usePricingCalendar(RANGE);

	if (settings.isPending || prices.isPending) {
		return <p>Loading…</p>;
	}

	const error = settings.error ?? prices.error;
	if (error) {
		return <p role="alert">{error.message}</p>;
	}

	if (!activeRoomId) {
		return null;
	}

	return (
		<section>
			<nav aria-label="Rooms">
				{rooms.map((room) => (
					<button
						aria-pressed={room.id === activeRoomId}
						key={room.id}
						onClick={() => setSelectedRoomId(room.id)}
						type="button"
					>
						{room.name}
					</button>
				))}
			</nav>

			{days.map((day) => (
				<article key={day.date}>
					<h3>{day.date}</h3>
					<p>
						{day.price} {settings.data?.hotel.currency} · {day.status}
					</p>
					<p>{day.variance?.label ?? "No backend variance"}</p>
					<p>{day.restrictions.join(", ") || "No restrictions"}</p>
					<p>{day.error?.message ?? "No backend error"}</p>
					<button
						onClick={() =>
							updatePrice.mutate({
								date: day.date,
								price: 205,
								reason: "Manual override",
								roomId: activeRoomId,
							})
						}
						type="button"
					>
						Save manual price
					</button>
				</article>
			))}

			{updatePrice.isPending ? <p>Saving…</p> : null}
			{updatePrice.isError ? (
				<p role="alert">{updatePrice.error.message}</p>
			) : null}
			{updatePrice.data ? (
				<p role="status">
					{updatePrice.data.day.price} · {updatePrice.data.day.status}
				</p>
			) : null}
		</section>
	);
}

interface AppProps {
	token: string;
}

export function App({ token }: AppProps) {
	return (
		<PricingCalendarProvider
			config={{
				baseUrl: "https://pricing.example.com",
				propertyId: "property-1001",
				headers: () => ({ Authorization: `Bearer ${token}` }),
			}}
		>
			<MyCalendar />
		</PricingCalendarProvider>
	);
}
```

`usePricingCalendar` returns settings, prices, rooms, active room state, filtered days and the write mutation. Never recalculate the displayed price from `recommendedPrice`, `occupancy` or `variance`.

## Transport-only client

```ts
import {
	createPricingClient,
	pricingKeys,
} from "@hpc/pricing-calendar";
import type { PricesQuery } from "@hpc/pricing-calendar/contracts";
import type { QueryClient } from "@tanstack/react-query";

const RANGE: PricesQuery = {
	from: "2026-11-23",
	to: "2026-11-29",
	rooms: ["1001"],
};

export async function prefetchPricing(
	queryClient: QueryClient,
	token: string,
	signal?: AbortSignal,
) {
	const client = createPricingClient({
		baseUrl: "https://pricing.example.com",
		propertyId: "property-1001",
		headers: () => ({ Authorization: `Bearer ${token}` }),
		credentials: "include",
	});

	const [settings, prices] = await Promise.all([
		client.getSettings(signal),
		client.getPrices(RANGE, signal),
	]);

	queryClient.setQueryData(pricingKeys.settings(client.propertyId), settings);
	queryClient.setQueryData(
		pricingKeys.prices(client.propertyId, RANGE),
		prices,
	);

	return client;
}
```

`createPricingClient` sends `x-property-id`, validates requests and responses with Zod schemas generated from the OpenAPI contract, and maps backend errors to `PricingApiError`. Raw base-relative paths are available as `apiPaths` from `@hpc/pricing-calendar/contracts`.

## Server rendering

Create one `QueryClient` per request and pass it to the provider. Do not share a module-scope cache between requests.

```tsx
<PricingCalendarProvider
	config={{ baseUrl: apiBaseUrl, propertyId: propertyId }}
	queryClient={requestQueryClient}
>
	<PricingCalendar {...RANGE} />
</PricingCalendarProvider>
```

The TanStack Start playground is the working reference for this pattern. The plain Vite demo shows the same SDK without Mantine or Start.
