import { PricingCalendarProvider } from "@hpc/pricing-calendar";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { fixtureFetch } from "./fixtureFetch";
import "./styles.css";

const container = document.getElementById("root");

if (!container) {
	throw new Error("Root container missing");
}

createRoot(container).render(
	<StrictMode>
		<PricingCalendarProvider
			config={{
				baseUrl: "/api",
				propertyId: "headless-demo-property",
				fetch: fixtureFetch,
			}}
		>
			<App />
		</PricingCalendarProvider>
	</StrictMode>,
);
