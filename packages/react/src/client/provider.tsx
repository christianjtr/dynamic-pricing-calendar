import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	createContext,
	type ReactNode,
	useContext,
	useMemo,
	useState,
} from "react";
import {
	createPricingClient,
	type PricingClient,
	type PricingClientConfig,
} from "./client";

const PricingClientContext = createContext<PricingClient | null>(null);

const createDefaultQueryClient = () =>
	new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 60_000,
				retry: 1,
				refetchOnWindowFocus: false,
			},
		},
	});

export interface PricingCalendarProviderProps {
	config: PricingClientConfig;
	queryClient?: QueryClient;
	children: ReactNode;
}

export function PricingCalendarProvider({
	config,
	queryClient,
	children,
}: PricingCalendarProviderProps) {
	const { baseUrl, propertyId, fetch: fetchFn, headers, credentials } = config;
	const client = useMemo(
		() =>
			createPricingClient({
				baseUrl,
				propertyId,
				fetch: fetchFn,
				headers,
				credentials,
			}),
		[baseUrl, propertyId, fetchFn, headers, credentials],
	);
	const [ownedQueryClient] = useState(createDefaultQueryClient);

	return (
		<PricingClientContext.Provider value={client}>
			<QueryClientProvider client={queryClient ?? ownedQueryClient}>
				{children}
			</QueryClientProvider>
		</PricingClientContext.Provider>
	);
}

export function usePricingClient(): PricingClient {
	const client = useContext(PricingClientContext);
	if (!client) {
		throw new Error(
			"usePricingClient must be used inside PricingCalendarProvider",
		);
	}
	return client;
}
