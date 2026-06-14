/// <reference types="vinxi/types/client" />
import ReactDOM from "react-dom/client";

import "@mantine/core/styles.css";

import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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

const queryClient = new QueryClient();

function App() {
	const { data: settings, isLoading } = useHotelSettings();

	if (isLoading || !settings) {
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
