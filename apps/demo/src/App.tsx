import type { DayPrice } from "@hpc/contracts";
import { usePricingCalendar } from "@hpc/pricing-calendar";
import { useState } from "react";

const DATE_RANGE = {
	from: "2026-11-23",
	to: "2026-11-29",
} as const;

const dateFormatter = new Intl.DateTimeFormat("en-NZ", {
	day: "numeric",
	month: "short",
	timeZone: "UTC",
	weekday: "short",
});

function formatDate(value: string) {
	return dateFormatter.format(new Date(`${value}T00:00:00Z`));
}

function formatMoney(currency: string, value: number | null) {
	if (value === null) {
		return "—";
	}

	return new Intl.NumberFormat("en-NZ", {
		currency,
		style: "currency",
	}).format(value);
}

function describeDay(day: DayPrice) {
	return [day.variance?.label, ...day.restrictions, day.error?.message]
		.filter((value): value is string => Boolean(value))
		.join(" · ");
}

export function App() {
	const {
		settings,
		prices,
		rooms,
		activeRoomId,
		setSelectedRoomId,
		days,
		updatePrice,
	} = usePricingCalendar({ ...DATE_RANGE });
	const [selectedDate, setSelectedDate] = useState<string | null>(null);
	const selectedDay = days.find((day) => day.date === selectedDate) ?? days[0];
	const selectedRoomName =
		rooms.find((room) => room.id === activeRoomId)?.name ?? "room";
	const currency =
		settings.data?.hotel.currency ?? prices.data?.currency ?? "NZD";
	const loadError = settings.error ?? prices.error;

	if (settings.isPending || prices.isPending) {
		return (
			<main className="demo-shell">
				<p className="demo-status" role="status">
					Loading backend-owned pricing data…
				</p>
			</main>
		);
	}

	if (loadError) {
		return (
			<main className="demo-shell">
				<p className="demo-status demo-status--error" role="alert">
					{loadError.message}
				</p>
			</main>
		);
	}

	return (
		<main className="demo-shell">
			<header className="demo-header">
				<p className="demo-eyebrow">Independent consumer</p>
				<h1>Headless Pricing Calendar</h1>
				<p className="demo-lede">
					Own presentation, own tokens, and no UI kit dependency. Every value
					below comes from the external-style pricing API through the public
					SDK.
				</p>
				{settings.data ? (
					<dl className="demo-meta">
						<div>
							<dt>Hotel</dt>
							<dd>{settings.data.hotel.timezone}</dd>
						</div>
						<div>
							<dt>Locale</dt>
							<dd>{settings.data.hotel.locale}</dd>
						</div>
						<div>
							<dt>Currency</dt>
							<dd>{currency}</dd>
						</div>
					</dl>
				) : null}
			</header>

			<nav aria-label="Rooms" className="demo-rooms">
				{rooms.map((room) => (
					<button
						aria-pressed={room.id === activeRoomId}
						className="demo-room"
						key={room.id}
						onClick={() => {
							setSelectedRoomId(room.id);
							setSelectedDate(null);
							updatePrice.reset();
						}}
						type="button"
					>
						{room.name}
					</button>
				))}
			</nav>

			{activeRoomId ? (
				<section aria-label="Prices" className="demo-table-wrap">
					<table className="demo-table">
						<caption>
							{selectedRoomName} · {formatDate(DATE_RANGE.from)} –{" "}
							{formatDate(DATE_RANGE.to)}
						</caption>
						<thead>
							<tr>
								<th scope="col">Date</th>
								<th scope="col">Price</th>
								<th scope="col">Status</th>
								<th scope="col">In PMS</th>
								<th scope="col">Recommended</th>
								<th scope="col">Variance</th>
								<th scope="col">Availability</th>
								<th scope="col">Occupancy</th>
								<th scope="col">Backend notes</th>
							</tr>
						</thead>
						<tbody>
							{days.map((day) => (
								<tr
									className={
										day.date === selectedDay?.date
											? "demo-row demo-row--selected"
											: "demo-row"
									}
									key={day.date}
								>
									<th scope="row">
										<button
											className="demo-day-button"
											onClick={() => {
												setSelectedDate(day.date);
												updatePrice.reset();
											}}
											type="button"
										>
											{formatDate(day.date)}
										</button>
									</th>
									<td>{formatMoney(currency, day.price)}</td>
									<td>{day.status}</td>
									<td>{formatMoney(currency, day.priceInPms)}</td>
									<td>{formatMoney(currency, day.recommendedPrice)}</td>
									<td>{day.variance?.label ?? "—"}</td>
									<td>{day.availability}</td>
									<td>
										{day.occupancy === null
											? "—"
											: `${Math.round(day.occupancy * 100)}%`}
									</td>
									<td>{describeDay(day) || "—"}</td>
								</tr>
							))}
						</tbody>
					</table>
				</section>
			) : null}

			{activeRoomId && selectedDay ? (
				<form
					className="demo-editor"
					key={`${activeRoomId}:${selectedDay.date}`}
					onSubmit={(event) => {
						event.preventDefault();
						const formData = new FormData(event.currentTarget);
						updatePrice.mutate({
							date: selectedDay.date,
							price: Number(formData.get("price")),
							reason: "Headless demo override",
							roomId: activeRoomId,
						});
					}}
				>
					<h2>Manual price</h2>
					<p>
						Send an override for {formatDate(selectedDay.date)} in{" "}
						{selectedRoomName}. The backend response is the only source of
						truth.
					</p>
					<label>
						Price
						<input
							defaultValue={selectedDay.price ?? ""}
							min="0"
							name="price"
							required
							step="0.01"
							type="number"
						/>
					</label>
					<button disabled={updatePrice.isPending} type="submit">
						{updatePrice.isPending ? "Saving…" : "Save manual price"}
					</button>
					{updatePrice.isError ? (
						<p className="demo-message demo-message--error" role="alert">
							{updatePrice.error.message}
						</p>
					) : null}
					{updatePrice.data ? (
						<p className="demo-message" role="status">
							Backend accepted{" "}
							{formatMoney(currency, updatePrice.data.day.price)} with status{" "}
							{updatePrice.data.day.status}.
						</p>
					) : null}
				</form>
			) : null}
		</main>
	);
}
