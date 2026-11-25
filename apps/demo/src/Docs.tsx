import openapiUrl from "@hpc/contracts/openapi.yaml?url";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

export default function Docs() {
	return (
		<main
			className="mx-auto max-w-6xl scroll-mt-4 px-4 py-10 sm:px-6 lg:px-8"
			id="main-content"
			tabIndex={-1}
		>
			<header className="mb-6 flex flex-wrap items-end justify-between gap-4">
				<div>
					<h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
						API Documentation
					</h1>
					<p className="mt-2 max-w-2xl text-muted-foreground">
						Generated from the canonical OpenAPI contract. A backend implements
						these operations; this demo does not provide a live server.
					</p>
				</div>
				<a
					className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
					download
					href={openapiUrl}
				>
					Download OpenAPI YAML
				</a>
			</header>
			<div className="rounded-card border bg-card p-4 text-foreground">
				<SwaggerUI deepLinking url={openapiUrl} />
			</div>
			<p className="mt-6 text-sm text-muted-foreground">
				<a
					className="underline underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
					href="/"
				>
					Back to the Calendar
				</a>
			</p>
		</main>
	);
}
