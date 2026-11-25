const linkClass =
	"underline underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const codeClass =
	"overflow-x-auto rounded-card border bg-muted/40 p-4 font-mono text-xs leading-relaxed text-foreground";

const configExample = `<script>
  window.pricingCalendarApi = {
    baseUrl: "https://pricing.example.com/api",
    propertyId: "hotel-42",
  };
</script>`;

const testBackendExample = `pnpm dev
pnpm dev:test-backend`;

const endpoints = [
	{
		method: "GET",
		path: "/settings",
		purpose: "Hotel timezone, locale, currency, rooms and date range.",
	},
	{
		method: "GET",
		path: "/prices?from=…&to=…&room=1001",
		purpose: "Backend-computed days for the visible range.",
	},
	{
		method: "PATCH",
		path: "/prices/1001/2026-11-26",
		purpose: "Submit a manual price intent; the response is canonical.",
	},
] as const;

export function Integrate() {
	return (
		<main
			className="mx-auto max-w-3xl scroll-mt-4 px-4 py-10 sm:px-6 lg:px-8"
			id="main-content"
			tabIndex={-1}
		>
			<header className="mb-8">
				<h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
					Integrate your backend
				</h1>
				<p className="mt-2 max-w-2xl text-muted-foreground">
					This app renders prices. Your backend computes them. Connect the two
					through one small HTTP contract — no SDK and no local pricing logic.
				</p>
			</header>

			<div className="grid gap-4">
				<section className="rounded-card border bg-card p-5">
					<h2 className="text-lg font-semibold">Who owns what</h2>
					<div className="mt-3 grid gap-3 sm:grid-cols-2">
						<div className="rounded-card border bg-muted/30 p-4">
							<h3 className="text-sm font-semibold">Your backend</h3>
							<p className="mt-1 text-sm text-muted-foreground">
								Prices, recommendations, variance, availability, occupancy,
								restrictions, currency, validation and authorization.
							</p>
						</div>
						<div className="rounded-card border bg-muted/30 p-4">
							<h3 className="text-sm font-semibold">This repository</h3>
							<p className="mt-1 text-sm text-muted-foreground">
								The OpenAPI contract, generated validators, Swagger UI and a
								demo that displays the returned fields verbatim.
							</p>
						</div>
					</div>
				</section>

				<section className="rounded-card border bg-card p-5">
					<h2 className="text-lg font-semibold">The three endpoints</h2>
					<p className="mt-2 text-sm text-muted-foreground">
						Implement these operations in any language. Full request and
						response schemas live in the interactive reference at{" "}
						<a className={linkClass} href="/docs">
							/docs
						</a>
						.
					</p>
					<div className="mt-3 overflow-x-auto">
						<table className="w-full min-w-[32rem] border-collapse text-left text-sm">
							<thead className="border-b text-xs uppercase tracking-wide text-muted-foreground">
								<tr>
									<th className="py-2 pr-3 font-medium" scope="col">
										Method
									</th>
									<th className="py-2 pr-3 font-medium" scope="col">
										Path
									</th>
									<th className="py-2 font-medium" scope="col">
										Purpose
									</th>
								</tr>
							</thead>
							<tbody>
								{endpoints.map((endpoint) => (
									<tr className="border-b last:border-0" key={endpoint.path}>
										<td className="py-2 pr-3 align-top font-medium">
											{endpoint.method}
										</td>
										<td className="py-2 pr-3 align-top font-mono text-xs">
											{endpoint.path}
										</td>
										<td className="py-2 align-top text-muted-foreground">
											{endpoint.purpose}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</section>

				<section className="rounded-card border bg-card p-5">
					<h2 className="text-lg font-semibold">Connect the demo</h2>
					<p className="mt-2 text-sm text-muted-foreground">
						Add this before the app script in <code>apps/demo/index.html</code>.
						Leave it out and the app keeps using its labelled fixtures.{" "}
						<code>baseUrl</code> can be relative or absolute; a cross-origin
						backend must allow the demo origin through CORS.
					</p>
					<pre className={`${codeClass} mt-3`}>
						<code>{configExample}</code>
					</pre>
					<p className="mt-3 text-sm text-muted-foreground">
						Every request carries <code>x-property-id</code>. It identifies
						property context only — your backend performs its own authentication
						and authorization. The badge switches from{" "}
						<strong>Fixture data</strong> to <strong>Backend configured</strong>{" "}
						as soon as <code>baseUrl</code> is set; it is not a health check. On
						first load the range comes from <code>settings.dateRange</code>{" "}
						unless <code>?from</code> and <code>?to</code> are present.
					</p>
				</section>

				<section className="rounded-card border bg-card p-5">
					<h2 className="text-lg font-semibold">Try the configured path</h2>
					<p className="mt-2 text-sm text-muted-foreground">
						A dev-only test backend exercises real <code>fetch</code> and{" "}
						<code>PATCH</code> calls. It is a static test double, not a
						production backend and not a conformance certificate. Run both
						processes in separate terminals, then open{" "}
						<code>http://127.0.0.1:3001/test-backend.html</code>.
					</p>
					<pre className={`${codeClass} mt-3`}>
						<code>{testBackendExample}</code>
					</pre>
					<p className="mt-3 text-sm text-muted-foreground">
						The calendar starts on the backend's own date range and lets the
						backend accept or reject each save.
					</p>
				</section>

				<section className="rounded-card border bg-card p-5">
					<h2 className="text-lg font-semibold">Writes are intents</h2>
					<p className="mt-2 text-sm text-muted-foreground">
						The editor sends <code>price</code> and an optional{" "}
						<code>reason</code> through <code>PATCH</code>. Your backend decides
						whether to accept it and returns the canonical day. The UI replaces
						that day with the response — it never shows an optimistic price and
						never recomputes variance or occupancy locally.
					</p>
				</section>

				<section className="rounded-card border bg-card p-5">
					<h2 className="text-lg font-semibold">Before you call it done</h2>
					<ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
						<li>
							<code>/settings</code> returns at least one room with a stable{" "}
							<code>id</code>.
						</li>
						<li>
							Each day includes every required field, even when a value is{" "}
							<code>null</code>.
						</li>
						<li>
							Errors use the <code>{"{ error: { code, message } }"}</code>{" "}
							envelope.
						</li>
						<li>
							<code>generatedAt</code> is a UTC timestamp ending in{" "}
							<code>Z</code>.
						</li>
						<li>
							<code>PATCH</code> returns the canonical day after a successful
							write.
						</li>
					</ul>
					<p className="mt-3 text-sm text-muted-foreground">
						The complete step-by-step guide, JSON examples and failure modes are
						in <code>docs/integration.md</code> in the repository. This page and
						the FAQ describe the demo itself and are not translated by the
						calendar locale config.
					</p>
				</section>
			</div>

			<p className="mt-8 flex flex-wrap gap-4 text-sm text-muted-foreground">
				<a className={linkClass} href="/">
					Back to the Calendar
				</a>
				<a className={linkClass} href="/faq">
					How to use the demo
				</a>
			</p>
		</main>
	);
}
