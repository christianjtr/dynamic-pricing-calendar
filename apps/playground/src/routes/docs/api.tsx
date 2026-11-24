import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

export const Route = createFileRoute("/docs/api")({
	component: ApiDocumentationPage,
});

function ApiDocumentationPage() {
	const reference = useRef<HTMLDivElement>(null);
	const [loadError, setLoadError] = useState(false);

	useEffect(() => {
		let disposed = false;
		let unmount: (() => void) | undefined;

		void Promise.all([
			import("@scalar/api-reference-react/style.css"),
			import("@scalar/api-reference-react"),
		])
			.then(([, { ApiReferenceReact }]) => {
				if (disposed || !reference.current) {
					return;
				}

				const root = createRoot(reference.current);
				root.render(
					<ApiReferenceReact
						configuration={{
							url: "/openapi.yaml",
							servers: [
								{
									url: "/api",
									description: "Local playground fixtures only",
								},
							],
							withDefaultFonts: false,
						}}
					/>,
				);
				unmount = () => root.unmount();
			})
			.catch(() => {
				if (!disposed) {
					setLoadError(true);
				}
			});

		return () => {
			disposed = true;
			unmount?.();
		};
	}, []);

	return (
		<div className="playground-shell api-docs-shell">
			<header>
				<p>
					<Link to="/">← Back to the pricing calendar</Link>
				</p>
				<h1>Pricing Calendar API</h1>
				<p>
					A language-neutral HTTP contract for pricing services. React is only
					one possible client.
				</p>
				<p>
					<a download href="/openapi.yaml">
						Download the OpenAPI 3.1.1 specification (YAML)
					</a>
				</p>
			</header>

			<section aria-labelledby="integration-basics">
				<h2 id="integration-basics">Integration basics</h2>
				<ul>
					<li>
						Implement <code>GET /settings</code>, <code>GET /prices</code> and{" "}
						<code>
							PATCH /prices/{"{roomId}"}/{"{date}"}
						</code>
						.
					</li>
					<li>
						Repeat the <code>room</code> query parameter to filter multiple
						rooms; <code>from</code> and <code>to</code> are inclusive dates.
					</li>
					<li>
						<code>x-property-id</code> selects property context; it does not
						replace backend authorization. Authentication is
						deployment-specific.
					</li>
					<li>
						The backend computes prices and indicators. After a price update,
						return the canonical day for the client to display.
					</li>
				</ul>
				<p className="api-docs-fixture-note">
					The playground API uses deterministic local fixtures for
					demonstration; it is not a production pricing backend.
				</p>
			</section>

			<section aria-label="Interactive OpenAPI reference">
				{loadError ? (
					<main>
						<p role="alert">
							The interactive reference could not load. Use the OpenAPI download
							link above instead.
						</p>
					</main>
				) : (
					<div className="api-docs-viewer" ref={reference}>
						<p role="status">Loading the interactive API reference…</p>
					</div>
				)}
			</section>
		</div>
	);
}
