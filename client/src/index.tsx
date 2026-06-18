/// <reference types="vinxi/types/client" />
import ReactDOM from "react-dom/client";

import "@mantine/core/styles.css";

import { Alert, Button, Container, Text } from "@mantine/core";
import { MantineProvider } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import {
	QueryCache,
	QueryClient,
	QueryClientProvider,
} from "@tanstack/react-query";
import { Suspense, lazy } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AppLayout } from "./components/Layout/AppLayout";
import { AppLoader } from "./components/Layout/AppLoader";
import { HotelSettingsProvider } from "./context/HotelSettingsContext";
import { OptimizedRatesDashboard } from "./features/OptimizedRates";
import { useHotelSettings } from "./hooks/queries/useHotelSettings";

const ReactQueryDevtools = lazy(() =>
	import("@tanstack/react-query-devtools").then((m) => ({
		default: m.ReactQueryDevtools,
	})),
);

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 2,
			staleTime: 5 * 60 * 1000,
		},
	},
	queryCache: new QueryCache({
		onError: (error) => {
			console.error("❌ Global Query Error:", error);
		},
	}),
});

function App() {
	const {
		data: settings,
		isLoading,
		isError,
		error,
		refetch,
	} = useHotelSettings();

	if (isLoading) {
		return <AppLoader />;
	}

	if (isError) {
		return (
			<Container size="sm" py="xl">
				<Alert
					icon={<IconAlertTriangle size={24} />}
					color="red"
					radius="md"
					title="Error loading hotel settings"
					variant="light"
				>
					<Text mb="md">
						{error?.message ||
							"Failed to load hotel configuration. Please try again."}
					</Text>
					<Button onClick={() => refetch()} color="red" variant="filled">
						Retry
					</Button>
				</Alert>
			</Container>
		);
	}

	if (!settings) {
		return <AppLoader />;
	}

	return (
		<HotelSettingsProvider initialSettings={settings}>
			<AppLayout>
				<OptimizedRatesDashboard />
			</AppLayout>
		</HotelSettingsProvider>
	);
}

const rootElement = document.getElementById("root");

if (rootElement) {
	ReactDOM.createRoot(rootElement).render(
		<QueryClientProvider client={queryClient}>
			<MantineProvider>
				<ErrorBoundary>
					<App />
				</ErrorBoundary>
			</MantineProvider>
			{import.meta.env.DEV && (
				<Suspense fallback={null}>
					<ReactQueryDevtools initialIsOpen={false} />
				</Suspense>
			)}
		</QueryClientProvider>,
	);
}
