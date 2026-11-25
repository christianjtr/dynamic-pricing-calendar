const linkClass =
	"underline underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function Faq() {
	return (
		<main
			className="mx-auto max-w-3xl scroll-mt-4 px-4 py-10 sm:px-6 lg:px-8"
			id="main-content"
			tabIndex={-1}
		>
			<header className="mb-8">
				<h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
					How to use the demo
				</h1>
				<p className="mt-2 max-w-2xl text-muted-foreground">
					A short guide to the calendar, the edit dialog and the shareable URL.
				</p>
			</header>

			<div className="grid gap-4">
				<section className="rounded-card border bg-card p-5">
					<h2 className="text-lg font-semibold">What am I looking at?</h2>
					<p className="mt-2 text-sm text-muted-foreground">
						Static fixtures labelled “No live backend connected”. This
						repository does not calculate or validate prices: every price,
						recommendation, status and indicator comes from a response shaped by
						the OpenAPI contract. A real backend would supply those values.
					</p>
				</section>

				<section className="rounded-card border bg-card p-5">
					<h2 className="text-lg font-semibold">How do I navigate?</h2>
					<ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
						<li>
							Use the room buttons to switch between the three fixture rooms.
						</li>
						<li>
							Change <code>From</code> and <code>To</code>, or use the previous
							and next month buttons to shift the visible range.
						</li>
						<li>
							Use the day arrows to move the selection one day at a time.
							Periods without fixtures show an explicit empty state instead of
							invented data.
						</li>
					</ul>
				</section>

				<section className="rounded-card border bg-card p-5">
					<h2 className="text-lg font-semibold">
						What is the difference between selecting and editing?
					</h2>
					<p className="mt-2 text-sm text-muted-foreground">
						Clicking a date only selects it: the row is highlighted and{" "}
						<code>?date=</code> changes. The <strong>Edit selected day</strong>{" "}
						button opens a native dialog anchored to that button. On narrow
						screens it becomes a bottom sheet. <kbd>Escape</kbd> or Cancel
						closes it and returns focus to the button.
					</p>
				</section>

				<section className="rounded-card border bg-card p-5">
					<h2 className="text-lg font-semibold">What happens when I save?</h2>
					<p className="mt-2 text-sm text-muted-foreground">
						Price and Reason are sent as a manual price intent through the
						canonical PATCH operation. Some fixture days have no canonical
						update response; the dialog keeps the button available and explains
						why a write cannot complete. After a successful write, the backend
						response is the only source of truth — the UI never shows an
						optimistic price.
					</p>
				</section>

				<section className="rounded-card border bg-card p-5">
					<h2 className="text-lg font-semibold">
						Which URL parameters matter?
					</h2>
					<dl className="mt-2 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
						<div>
							<dt className="font-medium text-foreground">
								<code>?room=</code>
							</dt>
							<dd>Active room id.</dd>
						</div>
						<div>
							<dt className="font-medium text-foreground">
								<code>?date=</code>
							</dt>
							<dd>Selected day.</dd>
						</div>
						<div>
							<dt className="font-medium text-foreground">
								<code>?from=</code> and <code>?to=</code>
							</dt>
							<dd>Visible date range.</dd>
						</div>
						<div>
							<dt className="font-medium text-foreground">
								<code>?edit=1</code>
							</dt>
							<dd>Opens the editor for the selected day.</dd>
						</div>
					</dl>
					<p className="mt-3 text-sm text-muted-foreground">
						Theme is a local preference, so it is not part of the URL.
					</p>
				</section>

				<section className="rounded-card border bg-card p-5">
					<h2 className="text-lg font-semibold">Where is the API reference?</h2>
					<p className="mt-2 text-sm text-muted-foreground">
						The interactive Swagger UI lives at{" "}
						<a className={linkClass} href="/docs">
							/docs
						</a>{" "}
						and renders the canonical OpenAPI file, which you can download
						there. Implementing the contract does not prove that a backend is
						conformant; that requires testing a real implementation.
					</p>
				</section>

				<section className="rounded-card border bg-card p-5">
					<h2 className="text-lg font-semibold">How do I change the theme?</h2>
					<p className="mt-2 text-sm text-muted-foreground">
						Use the Light mode switch in the header. The first visit follows
						your system preference; after that the choice is saved in this
						browser.
					</p>
				</section>
			</div>

			<p className="mt-8 text-sm text-muted-foreground">
				<a className={linkClass} href="/">
					Back to the Calendar
				</a>
			</p>
		</main>
	);
}
