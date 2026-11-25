import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { fixtureDateRange, updateFixtures } from "@/fixtures/fixtures";
import {
	type DateRange,
	dateRangeHref,
	readDateRange,
	shiftMonth,
} from "@/lib/dateRange";
import { anchoredPosition, type Bounds } from "@/lib/dialogPosition";
import {
	buildDateRange,
	formatAvailability,
	formatDate,
	formatMoney,
	formatStatus,
	getDayIndicators,
} from "@/lib/format";
import {
	readEdit,
	readSelection,
	type Selection,
	selectionHref,
} from "@/lib/selectionUrl";
import { cn } from "@/lib/utils";
import { usePricing } from "@/usePricing";

export function App() {
	const initialSelection = readSelection(window.location.search);
	const [roomId, setRoomId] = useState<string | null>(initialSelection.roomId);
	const [selectedDate, setSelectedDate] = useState<string | null>(
		initialSelection.date,
	);
	const [range, setRange] = useState(() =>
		readDateRange(window.location.search, fixtureDateRange),
	);
	const [editing, setEditing] = useState(() =>
		readEdit(window.location.search),
	);
	const [anchorRect, setAnchorRect] = useState<Bounds | null>(null);
	const dialogRef = useRef<HTMLDialogElement>(null);
	const dates = useMemo(
		() => buildDateRange(range.from, range.to),
		[range.from, range.to],
	);
	const { settings, prices, rooms, activeRoomId, days, updatePrice } =
		usePricing(range, roomId);
	const selectedDay = days.find((day) => day.date === selectedDate) ?? days[0];
	const selectedIndex = days.findIndex((day) => day.date === selectedDay?.date);
	const roomName =
		rooms.find((room) => room.id === activeRoomId)?.name ?? "Room";
	const currency = settings.data?.hotel.currency ?? "NZD";
	const canUpdate = Boolean(
		updateFixtures[`${activeRoomId}:${selectedDay?.date}`],
	);

	const syncUrl = (
		selection: Selection,
		nextRange: DateRange,
		edit = selection.edit === true,
	) => {
		const ranged = new URL(
			dateRangeHref(window.location, nextRange),
			window.location.origin,
		);
		window.history.replaceState(
			null,
			"",
			selectionHref(ranged, { ...selection, edit }),
		);
	};

	const selectDay = (date: string) => {
		setSelectedDate(date);
		updatePrice.reset();
		syncUrl({ roomId: activeRoomId, date }, range);
	};

	const openEditor = (date: string, anchor: Bounds) => {
		setAnchorRect(anchor);
		setSelectedDate(date);
		setEditing(true);
		updatePrice.reset();
		syncUrl({ roomId: activeRoomId, date, edit: true }, range);
	};

	const closeEditor = () => {
		setEditing(false);
		setAnchorRect(null);
		updatePrice.reset();
		syncUrl({ roomId: activeRoomId, date: selectedDay?.date ?? null }, range);
	};

	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog || !selectedDay?.date) {
			return;
		}

		if (!editing) {
			if (dialog.open) {
				dialog.close();
			}
			return;
		}

		if (dialog.open) {
			return;
		}

		dialog.style.visibility = "hidden";
		dialog.showModal();
		if (anchorRect) {
			const panel = dialog.getBoundingClientRect();
			const position = anchoredPosition(anchorRect, panel, {
				width: window.innerWidth,
				height: window.innerHeight,
			});
			dialog.style.setProperty("--dialog-left", `${position.left}px`);
			dialog.style.setProperty("--dialog-top", `${position.top}px`);
			dialog.style.setProperty("--dialog-width", `${position.width}px`);
		} else {
			dialog.style.removeProperty("--dialog-left");
			dialog.style.removeProperty("--dialog-top");
			dialog.style.removeProperty("--dialog-width");
		}
		dialog.style.visibility = "";
		dialog.querySelector<HTMLInputElement>("#edit-price")?.focus();
	}, [editing, anchorRect, selectedDay?.date]);

	const applyRange = (nextRange: DateRange) => {
		const nextDate =
			selectedDate &&
			selectedDate >= nextRange.from &&
			selectedDate <= nextRange.to
				? selectedDate
				: null;
		setRange(nextRange);
		setSelectedDate(nextDate);
		updatePrice.reset();
		syncUrl({ roomId: activeRoomId, date: nextDate }, nextRange);
	};

	const moveDay = (delta: number) => {
		const next = days[selectedIndex + delta];
		if (next) {
			selectDay(next.date);
		}
	};

	if (settings.isPending || prices.isPending) {
		return (
			<main
				className="mx-auto max-w-6xl scroll-mt-4 px-4 py-16"
				id="main-content"
				tabIndex={-1}
			>
				<Card role="status">
					<CardContent className="p-6">
						Loading fixture-backed pricing data…
					</CardContent>
				</Card>
			</main>
		);
	}

	const loadError = settings.error ?? prices.error;
	if (loadError) {
		return (
			<main
				className="mx-auto max-w-6xl scroll-mt-4 px-4 py-16"
				id="main-content"
				tabIndex={-1}
			>
				<Card role="alert">
					<CardHeader>
						<CardTitle>Unable to load pricing data</CardTitle>
						<CardDescription>
							{loadError.message} Check the fixture response and try again.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button
							onClick={() => {
								void settings.refetch();
								void prices.refetch();
							}}
						>
							Retry
						</Button>
					</CardContent>
				</Card>
			</main>
		);
	}

	return (
		<main
			className="mx-auto max-w-6xl scroll-mt-4 px-4 py-10 sm:px-6 lg:px-8"
			id="main-content"
			tabIndex={-1}
		>
			<header className="mb-8 flex flex-wrap items-start justify-between gap-4">
				<div>
					<div className="mb-3 flex flex-wrap items-center gap-2">
						<Badge variant="outline">Fixture data</Badge>
						<span className="text-sm text-muted-foreground">
							No live backend connected
						</span>
					</div>
					<h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
						Pricing Calendar
					</h1>
					<p className="mt-2 max-w-2xl text-muted-foreground">
						A reference UI for prices computed by an external backend. This demo
						renders static fixtures and never calculates, recommends or
						validates a price itself.
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<Button asChild size="sm" variant="outline">
						<a href="/docs">API documentation</a>
					</Button>
					<ThemeToggle />
				</div>
			</header>

			{settings.data ? (
				<dl className="mb-6 grid gap-3 text-sm sm:grid-cols-3">
					<div className="rounded-card border bg-card p-3">
						<dt className="text-muted-foreground">Timezone</dt>
						<dd className="font-medium">{settings.data.hotel.timezone}</dd>
					</div>
					<div className="rounded-card border bg-card p-3">
						<dt className="text-muted-foreground">Locale</dt>
						<dd className="font-medium">{settings.data.hotel.locale}</dd>
					</div>
					<div className="rounded-card border bg-card p-3">
						<dt className="text-muted-foreground">Currency</dt>
						<dd className="font-medium">{currency}</dd>
					</div>
				</dl>
			) : null}

			<nav aria-label="Rooms" className="mb-6 flex flex-wrap gap-2">
				{rooms.map((room) => (
					<Button
						aria-pressed={room.id === activeRoomId}
						key={room.id}
						onClick={() => {
							setRoomId(room.id);
							setSelectedDate(null);
							updatePrice.reset();
							syncUrl({ roomId: room.id, date: null }, range);
						}}
						variant={room.id === activeRoomId ? "default" : "outline"}
					>
						{room.name}
					</Button>
				))}
			</nav>

			<Card>
				<CardHeader>
					<div className="flex flex-wrap items-center justify-between gap-4">
						<div>
							<CardTitle>{roomName}</CardTitle>
							<CardDescription>
								{formatDate(range.from)} – {formatDate(range.to)} ·{" "}
								{dates.length} days
							</CardDescription>
						</div>
						<div className="flex items-center gap-2">
							<Button
								aria-label="Previous Day"
								disabled={selectedIndex <= 0}
								onClick={() => moveDay(-1)}
								size="icon"
								variant="outline"
							>
								<ChevronLeft aria-hidden="true" className="size-4" />
							</Button>
							<span
								aria-live="polite"
								className="min-w-32 text-center text-sm font-medium tabular-nums"
							>
								{selectedDay ? formatDate(selectedDay.date) : "No day"}
							</span>
							<Button
								aria-label="Next Day"
								disabled={selectedIndex < 0 || selectedIndex >= days.length - 1}
								onClick={() => moveDay(1)}
								size="icon"
								variant="outline"
							>
								<ChevronRight aria-hidden="true" className="size-4" />
							</Button>
							<Button
								aria-haspopup="dialog"
								disabled={!selectedDay}
								onClick={(event) =>
									openEditor(
										selectedDay?.date ?? "",
										event.currentTarget.getBoundingClientRect(),
									)
								}
								size="sm"
							>
								Edit selected day
							</Button>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div className="mb-4 flex flex-wrap items-end gap-3">
						<label
							className="grid gap-1 text-xs font-medium text-muted-foreground"
							htmlFor="from"
						>
							From
							<Input
								id="from"
								max={range.to}
								onChange={(event) => {
									const from = event.target.value;
									if (from && from <= range.to) {
										applyRange({ from, to: range.to });
									}
								}}
								type="date"
								value={range.from}
							/>
						</label>
						<label
							className="grid gap-1 text-xs font-medium text-muted-foreground"
							htmlFor="to"
						>
							To
							<Input
								id="to"
								min={range.from}
								onChange={(event) => {
									const to = event.target.value;
									if (to && to >= range.from) {
										applyRange({ from: range.from, to });
									}
								}}
								type="date"
								value={range.to}
							/>
						</label>
						<div className="flex items-center gap-2">
							<Button
								onClick={() => applyRange(shiftMonth(range, -1))}
								size="sm"
								variant="outline"
							>
								<ChevronLeft aria-hidden="true" className="size-4" />
								Previous month
							</Button>
							<Button
								onClick={() => applyRange(shiftMonth(range, 1))}
								size="sm"
								variant="outline"
							>
								Next month
								<ChevronRight aria-hidden="true" className="size-4" />
							</Button>
						</div>
					</div>
					<div className="overflow-x-auto">
						<table className="w-full min-w-[64rem] border-collapse text-sm">
							<caption className="sr-only">
								Backend-provided prices for {roomName}
							</caption>
							<thead>
								<tr className="text-left text-muted-foreground">
									<th className="px-3 py-2 font-medium" scope="col">
										Date
									</th>
									<th className="px-3 py-2 font-medium" scope="col">
										Price
									</th>
									<th className="px-3 py-2 font-medium" scope="col">
										Status
									</th>
									<th className="px-3 py-2 font-medium" scope="col">
										In PMS
									</th>
									<th className="px-3 py-2 font-medium" scope="col">
										Recommended
									</th>
									<th className="px-3 py-2 font-medium" scope="col">
										Variance
									</th>
									<th className="px-3 py-2 font-medium" scope="col">
										Availability
									</th>
									<th className="px-3 py-2 font-medium" scope="col">
										Occupancy
									</th>
									<th className="px-3 py-2 font-medium" scope="col">
										Backend indicators
									</th>
								</tr>
							</thead>
							<tbody>
								{days.map((day) => (
									<tr
										className={cn(
											"border-t",
											day.date === selectedDay?.date && "bg-muted/60",
										)}
										key={day.date}
									>
										<th className="px-3 py-2 text-left font-medium" scope="row">
											<button
												aria-pressed={day.date === selectedDay?.date}
												className="rounded hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
												onClick={() => selectDay(day.date)}
												type="button"
											>
												{formatDate(day.date)}
											</button>
										</th>
										<td className="px-3 py-2 font-medium tabular-nums">
											{formatMoney(day.price, day.currency)}
										</td>
										<td className="px-3 py-2">{formatStatus(day.status)}</td>
										<td className="px-3 py-2 tabular-nums">
											{formatMoney(day.priceInPms, day.currency)}
										</td>
										<td className="px-3 py-2 tabular-nums">
											{formatMoney(day.recommendedPrice, day.currency)}
										</td>
										<td className="px-3 py-2 tabular-nums">
											{day.variance?.label ?? "—"}
										</td>
										<td className="px-3 py-2">
											{formatAvailability(day.availability)}
										</td>
										<td className="px-3 py-2 tabular-nums">
											{day.occupancy === null
												? "—"
												: `${Math.round(day.occupancy * 100)}%`}
										</td>
										<td className="px-3 py-2">
											<span className="flex flex-wrap gap-1">
												{getDayIndicators(day).map((indicator) => (
													<Badge
														key={indicator.label}
														variant={
															indicator.tone === "danger"
																? "destructive"
																: indicator.tone === "accent"
																	? "secondary"
																	: "outline"
														}
													>
														{indicator.label}
													</Badge>
												))}
											</span>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					{days.length === 0 ? (
						<p className="py-6 text-sm text-muted-foreground" role="status">
							No fixture data for this period. Choose another range to see the
							demo prices.
						</p>
					) : null}
				</CardContent>
			</Card>

			{selectedDay && activeRoomId ? (
				<dialog
					aria-describedby="day-edit-description"
					aria-labelledby="day-edit-title"
					className={cn(
						"day-edit-dialog rounded-card border bg-card p-5 text-card-foreground shadow-xl",
						anchorRect && "day-edit-dialog--anchored",
					)}
					onClose={closeEditor}
					ref={dialogRef}
				>
					<div className="mb-4 flex items-start justify-between gap-3">
						<div>
							<h2
								className="text-balance text-lg font-semibold"
								id="day-edit-title"
							>
								{roomName} · {formatDate(selectedDay.date)}
							</h2>
							<p
								className="mt-1 text-sm text-muted-foreground"
								id="day-edit-description"
							>
								Backend values stay read-only. Save submits a manual price
								intent.
							</p>
						</div>
						<Button
							aria-label="Close editor"
							onClick={() => dialogRef.current?.close()}
							size="icon"
							variant="ghost"
						>
							<span aria-hidden="true">×</span>
						</Button>
					</div>
					<dl className="mb-4 grid grid-cols-2 gap-2 text-sm">
						<div className="rounded-md border bg-muted/40 p-2">
							<dt className="text-muted-foreground">Backend price</dt>
							<dd className="font-medium tabular-nums">
								{formatMoney(selectedDay.price, selectedDay.currency)}
							</dd>
						</div>
						<div className="rounded-md border bg-muted/40 p-2">
							<dt className="text-muted-foreground">Status</dt>
							<dd className="font-medium">
								{formatStatus(selectedDay.status)}
							</dd>
						</div>
						<div className="rounded-md border bg-muted/40 p-2">
							<dt className="text-muted-foreground">Recommended</dt>
							<dd className="font-medium tabular-nums">
								{formatMoney(
									selectedDay.recommendedPrice,
									selectedDay.currency,
								)}
							</dd>
						</div>
						<div className="rounded-md border bg-muted/40 p-2">
							<dt className="text-muted-foreground">Variance</dt>
							<dd className="font-medium tabular-nums">
								{selectedDay.variance?.label ?? "—"}
							</dd>
						</div>
					</dl>
					<form
						className="grid gap-4"
						key={`${activeRoomId}:${selectedDay.date}:${selectedDay.price}`}
						onSubmit={(event) => {
							event.preventDefault();
							const formData = new FormData(event.currentTarget);
							updatePrice.mutate({
								date: selectedDay.date,
								price: Number(formData.get("price")),
								reason: String(formData.get("reason") ?? "Manual override"),
								roomId: activeRoomId,
							});
						}}
					>
						<label className="grid gap-2 text-sm" htmlFor="edit-price">
							<span>Price</span>
							<Input
								autoComplete="off"
								defaultValue={selectedDay.price ?? ""}
								id="edit-price"
								inputMode="decimal"
								min="0"
								name="price"
								required
								step="0.01"
								type="number"
							/>
						</label>
						<label className="grid gap-2 text-sm" htmlFor="edit-reason">
							<span>Reason</span>
							<Input
								autoComplete="off"
								defaultValue="Manual override"
								id="edit-reason"
								name="reason"
								placeholder="e.g. Peak demand…"
							/>
						</label>
						<div className="flex justify-end gap-2">
							<Button
								onClick={() => dialogRef.current?.close()}
								type="button"
								variant="outline"
							>
								Cancel
							</Button>
							<Button
								disabled={
									updatePrice.isPending ||
									selectedDay.status === "closed" ||
									!canUpdate
								}
								type="submit"
							>
								{updatePrice.isPending ? "Saving…" : "Save Manual Price"}
							</Button>
						</div>
					</form>
					{!canUpdate ? (
						<p className="mt-4 text-sm text-muted-foreground">
							This fixture day has no canonical update response. Choose a day
							with one to try a write.
						</p>
					) : null}
					{updatePrice.isError ? (
						<p className="mt-4 text-sm text-destructive" role="alert">
							{updatePrice.error.message}
						</p>
					) : null}
					{updatePrice.data ? (
						<p className="mt-4 text-sm" role="status">
							Backend accepted{" "}
							{formatMoney(
								updatePrice.data.day.price,
								updatePrice.data.day.currency,
							)}{" "}
							with status {formatStatus(updatePrice.data.day.status)}.
						</p>
					) : null}
				</dialog>
			) : null}

			<footer className="mt-8 text-sm text-muted-foreground">
				All values come from the fixture response. See the{" "}
				<a
					className="underline underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
					href="/docs"
				>
					OpenAPI Reference
				</a>
				.
			</footer>
		</main>
	);
}
