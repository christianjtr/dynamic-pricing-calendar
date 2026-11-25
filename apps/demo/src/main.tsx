import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/App";
import "./styles.css";

const Docs = lazy(() => import("@/Docs"));

const container = document.getElementById("root");

if (!container) {
	throw new Error("Root container missing");
}

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
			staleTime: 60_000,
		},
	},
});

const isDocsPage = window.location.pathname.replace(/\/$/, "") === "/docs";

const page = isDocsPage ? (
	<Suspense fallback={<p className="p-8">Loading API documentation…</p>}>
		<Docs />
	</Suspense>
) : (
	<App />
);

// Swagger UI uses legacy lifecycles that warn under StrictMode.
createRoot(container).render(
	<QueryClientProvider client={queryClient}>
		{isDocsPage ? page : <StrictMode>{page}</StrictMode>}
	</QueryClientProvider>,
);
