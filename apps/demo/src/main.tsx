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

const skipLink = (
	<a
		className="sr-only rounded-md bg-card px-4 py-2 text-foreground ring-2 ring-ring hover:bg-muted focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50"
		href="#main-content"
	>
		Skip to Content
	</a>
);

// Swagger UI uses legacy lifecycles that warn under StrictMode.
createRoot(container).render(
	<QueryClientProvider client={queryClient}>
		{skipLink}
		{isDocsPage ? page : <StrictMode>{page}</StrictMode>}
	</QueryClientProvider>,
);
