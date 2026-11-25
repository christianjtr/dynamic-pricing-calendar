import {
	CalendarDays,
	CalendarOff,
	ChevronLeft,
	ChevronRight,
	Pencil,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { readApiConfig } from "@/lib/apiConfig";
import {
	type DateRange,
	dateRangeHref,
	hasExplicitDateRange,
	rangeAroundDay,
	readDateRange,
	shiftMonth,
	todayInTimeZone,
} from "@/lib/dateRange";
import { anchoredPosition, type Bounds } from "@/lib/dialogPosition";
import {
	buildDateRange,
	formatAvailability,
	formatDate,
	formatMoney,
	formatPercent,
	formatStatus,
	getDayNotes,
	statusTone,
} from "@/lib/format";
import { t } from "@/lib/i18n";
import {
	readEdit,
	readSelection,
	type Selection,
	selectionHref,
} from "@/lib/selectionUrl";
import { cn } from "@/lib/utils";
import { canWriteDay } from "@/lib/writePolicy";
import { usePricing } from "@/usePricing";

export function App() {
	const usingFixtures = !readApiConfig().baseUrl;
	const initialSelection = readSelection(window.location.search);
	const [roomId, setRoomId] = useState<string | null>(initialSelection.roomId);
	const [selectedDate, setSelectedDate] = useState<string | null>(
		initialSelection.date,
	);
	const [hasUrlRange] = useState(() =>
		hasExplicitDateRange(window.location.search),
	);
	const [range, setRange] = useState<DateRange | null>(() =>
		hasUrlRange
			? readDateRange(window.location.search, fixtureDateRange)
			: null,
	);
	const [editing, setEditing] = useState(() =>
		readEdit(window.location.search),
	);
	const [anchorRect, setAnchorRect] = useState<Bounds | null>(null);
	const dialogRef = useRef<HTMLDialogElement>(null);
	const dates = useMemo(
		() => (range ? buildDateRange(range.from, range.to) : []),
		[range],
	);
	const { settings, prices, rooms, activeRoomId, days, updatePrice } =
		usePricing(range, roomId);
	const selectedDay = days.find((day) => day.date === selectedDate) ?? days[0];
	const selectedIndex = days.findIndex((day) => day.date === selectedDay?.date);
	const activeRoom = rooms.find((room) => room.id === activeRoomId);
	const roomName = activeRoom?.name ?? "Room";
	const roomDescription = activeRoom?.description;
	const currency = settings.data?.hotel.currency ?? "NZD";
	const currencies = [...new Set(days.map((day) => day.currency))];
	const mixedCurrencies = currencies.length > 1;
	const headerCurrency = mixedCurrencies ? null : (currencies[0] ?? currency);
	const canUpdate = canWriteDay(
		usingFixtures,
		Boolean(updateFixtures[`${activeRoomId}:${selectedDay?.date}`]),
	);

	const syncUrl = useCallback(
		(
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
		},
		[],
	);

	useEffect(() => {
		if (range !== null || !settings.data) {
			return;
		}
		const nextRange = { ...settings.data.dateRange };
		setRange(nextRange);
		syncUrl({ roomId: activeRoomId, date: selectedDate }, nextRange);
	}, [range, settings.data, activeRoomId, selectedDate, syncUrl]);

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

	if (!range || settings.isPending || prices.isPending) {
		return (
			<main
				className="mx-auto max-w-6xl scroll-mt-4 px-4 py-16"
				id="main-content"
				tabIndex={-1}
			>
				<Card role="status">
					<CardContent className="p-6">{t("calendar.loading")}</CardContent>
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
						<CardTitle>{t("calendar.errorTitle")}</CardTitle>
						<CardDescription>
							{t("calendar.errorBody", { message: loadError.message })}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button
							onClick={() => {
								void settings.refetch();
								void prices.refetch();
							}}
						>
							{t("calendar.retry")}
						</Button>
					</CardContent>
				</Card>
			</main>
		);
	}

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

	const goToToday = () => {
		const today = todayInTimeZone(settings.data?.hotel.timezone ?? "UTC");
		const nextRange =
			today >= range.from && today <= range.to ? range : rangeAroundDay(today);
		setEditing(false);
		setAnchorRect(null);
		setRange(nextRange);
		setSelectedDate(today);
		updatePrice.reset();
		syncUrl({ roomId: activeRoomId, date: today }, nextRange);
	};

	return (
		<main
			className="mx-auto max-w-6xl scroll-mt-4 px-4 py-10 sm:px-6 lg:px-8"
			id="main-content"
			tabIndex={-1}
		>
			<header className="mb-8">
				<div className="mb-3 flex flex-wrap items-center gap-2">
					<Badge
						className={cn(
							"gap-1.5 border-warning bg-warning/10 text-foreground",
							!usingFixtures && "border-border bg-muted text-foreground",
						)}
					>
						<span
							aria-hidden="true"
							className={cn(
								"size-1.5 rounded-full bg-warning",
								!usingFixtures && "bg-foreground",
							)}
						/>
						{t(
							usingFixtures ? "calendar.fixtureBadge" : "calendar.backendBadge",
						)}
					</Badge>
					{usingFixtures ? (
						<span className="text-sm text-muted-foreground">
							{t("calendar.noBackend")}
						</span>
					) : null}
					<a
						className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
						href="/integrate"
					>
						{t("calendar.integrateLink")}
					</a>
				</div>
				<h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
					{t("calendar.title")}
				</h1>
				<p className="mt-2 max-w-2xl text-muted-foreground">
					{t(usingFixtures ? "calendar.intro" : "calendar.introLive")}
				</p>
				{settings.data ? (
					<dl className="mt-3 flex flex-wrap gap-2 text-xs">
						<div className="flex items-center gap-1.5 rounded-full border bg-muted/40 px-2.5 py-1">
							<dt className="text-muted-foreground">
								{t("calendar.timezone")}
							</dt>
							<dd className="font-semibold text-foreground" translate="no">
								{settings.data.hotel.timezone}
							</dd>
						</div>
						<div className="flex items-center gap-1.5 rounded-full border bg-muted/40 px-2.5 py-1">
							<dt className="text-muted-foreground">{t("calendar.locale")}</dt>
							<dd className="font-semibold text-foreground" translate="no">
								{settings.data.hotel.locale}
							</dd>
						</div>
					</dl>
				) : null}
			</header>

			<nav
				aria-label={t("calendar.roomsLabel")}
				className="mb-6 flex flex-wrap gap-2"
			>
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
						title={room.description}
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
							<CardTitle className="text-xl">{roomName}</CardTitle>
							{roomDescription ? (
								<p className="mt-0.5 text-sm font-medium text-foreground">
									{roomDescription}
								</p>
							) : null}
							<CardDescription className="text-xs">
								{formatDate(range.from)} – {formatDate(range.to)} ·{" "}
								{t("calendar.days", { count: dates.length })} ·{" "}
								{t("calendar.pricesLabel")}{" "}
								{headerCurrency ? (
									<span className="text-foreground" translate="no">
										{headerCurrency}
									</span>
								) : (
									t("calendar.multipleCurrencies")
								)}
							</CardDescription>
						</div>
						<div className="flex items-center gap-2">
							<Button
								aria-label={t("calendar.previousDay")}
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
								{selectedDay
									? formatDate(selectedDay.date)
									: t("calendar.noDay")}
							</span>
							<Button
								aria-label={t("calendar.nextDay")}
								disabled={selectedIndex < 0 || selectedIndex >= days.length - 1}
								onClick={() => moveDay(1)}
								size="icon"
								variant="outline"
							>
								<ChevronRight aria-hidden="true" className="size-4" />
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
							{t("calendar.from")}
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
							{t("calendar.to")}
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
							<Button onClick={goToToday} size="sm" variant="outline">
								<CalendarDays aria-hidden="true" className="size-4" />
								{t("calendar.today")}
							</Button>
							<Button
								onClick={() => applyRange(shiftMonth(range, -1))}
								size="sm"
								variant="outline"
							>
								<ChevronLeft aria-hidden="true" className="size-4" />
								{t("calendar.previousMonth")}
							</Button>
							<Button
								onClick={() => applyRange(shiftMonth(range, 1))}
								size="sm"
								variant="outline"
							>
								{t("calendar.nextMonth")}
								<ChevronRight aria-hidden="true" className="size-4" />
							</Button>
						</div>
					</div>
					{days.length === 0 ? (
						<div
							className="flex flex-col items-center justify-center rounded-card border border-dashed bg-muted/30 px-6 py-12 text-center"
							role="status"
						>
							<div className="mb-3 rounded-full border bg-background p-3">
								<CalendarOff
									aria-hidden="true"
									className="size-5 text-muted-foreground"
								/>
							</div>
							<p className="text-sm font-semibold text-foreground">
								{t("empty.title")}
							</p>
							<p className="mt-1 max-w-sm text-sm text-muted-foreground">
								{t("empty.body")}
							</p>
							<Button
								className="mt-4"
								onClick={() =>
									applyRange({
										...(settings.data?.dateRange ?? fixtureDateRange),
									})
								}
								size="sm"
								variant="outline"
							>
								{t("empty.action")}
							</Button>
						</div>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full min-w-[56rem] border-collapse text-sm">
								<caption className="sr-only">
									{t("table.caption", { room: roomName })}
								</caption>
								<thead>
									<tr className="text-left text-muted-foreground">
										<th
											className="min-w-[7.5rem] whitespace-nowrap px-3 py-2 font-medium"
											scope="col"
										>
											{t("table.date")}
										</th>
										<th
											className="px-3 py-2 text-right font-medium"
											scope="col"
										>
											{t("table.price")}
										</th>
										<th className="px-3 py-2 font-medium" scope="col">
											{t("table.status")}
										</th>
										<th
											className="px-3 py-2 text-right font-medium"
											scope="col"
										>
											{t("table.recommended")}
										</th>
										<th
											className="px-3 py-2 text-right font-medium"
											scope="col"
										>
											{t("table.availability")}
										</th>
										<th className="px-3 py-2 font-medium" scope="col">
											{t("table.notes")}
										</th>
										<th className="px-3 py-2 font-medium" scope="col">
											{t("table.actions")}
										</th>
									</tr>
								</thead>
								<tbody>
									{days.map((day) => {
										const currencyPrefix = mixedCurrencies ? (
											<span
												className="font-normal text-muted-foreground"
												translate="no"
											>
												{day.currency}{" "}
											</span>
										) : null;
										return (
											<tr
												className={cn(
													"border-t",
													day.date === selectedDay?.date && "bg-muted/60",
												)}
												key={day.date}
											>
												<th
													className="min-w-[7.5rem] whitespace-nowrap px-3 py-2 text-left font-medium"
													scope="row"
												>
													<button
														aria-pressed={day.date === selectedDay?.date}
														className="rounded hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
														onClick={() => selectDay(day.date)}
														type="button"
													>
														{formatDate(day.date)}
													</button>
												</th>
												<td className="px-3 py-2 text-right font-medium tabular-nums">
													<div>
														{currencyPrefix}
														{formatMoney(day.price)}
													</div>
													<div className="text-xs font-normal text-muted-foreground">
														{t("table.inPms")} {currencyPrefix}
														{formatMoney(day.priceInPms)}
													</div>
												</td>
												<td className="px-3 py-2">
													<Badge variant={statusTone(day.status)}>
														{formatStatus(day.status)}
													</Badge>
												</td>
												<td className="px-3 py-2 text-right tabular-nums">
													<div>
														{currencyPrefix}
														{formatMoney(day.recommendedPrice)}
													</div>
													<div className="text-xs text-muted-foreground">
														{t("table.variance")}{" "}
														<span translate="no">
															{day.variance?.label ?? "—"}
														</span>
													</div>
												</td>
												<td className="px-3 py-2 text-right">
													<div>{formatAvailability(day.availability)}</div>
													{day.occupancy !== null ? (
														<div className="text-xs text-muted-foreground tabular-nums">
															{t("table.occupied", {
																percent: formatPercent(day.occupancy),
															})}
														</div>
													) : null}
												</td>
												<td className="px-3 py-2">
													<span className="flex flex-wrap gap-1">
														{getDayNotes(day).map((note) => (
															<Badge
																key={note.label}
																variant={
																	note.tone === "danger"
																		? "destructive"
																		: "outline"
																}
															>
																{note.label}
															</Badge>
														))}
													</span>
												</td>
												<td className="px-3 py-2 text-right">
													<Button
														aria-haspopup="dialog"
														aria-label={t("table.editDay", {
															date: formatDate(day.date),
														})}
														onClick={(event) =>
															openEditor(
																day.date,
																event.currentTarget.getBoundingClientRect(),
															)
														}
														size="icon"
														variant="ghost"
													>
														<Pencil aria-hidden="true" className="size-4" />
													</Button>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</div>
					)}
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
								{t("editor.valuesLabel")}{" "}
								<span translate="no">{selectedDay.currency}</span>.{" "}
								{t("editor.description")}
							</p>
						</div>
						<Button
							aria-label={t("editor.close")}
							onClick={() => dialogRef.current?.close()}
							size="icon"
							variant="ghost"
						>
							<span aria-hidden="true">×</span>
						</Button>
					</div>
					<dl className="mb-4 grid grid-cols-2 gap-2 text-sm">
						<div className="rounded-md border bg-muted/40 p-2">
							<dt className="text-muted-foreground">
								{t("editor.backendPrice")}
							</dt>
							<dd className="font-medium tabular-nums">
								{formatMoney(selectedDay.price)}
							</dd>
						</div>
						<div className="rounded-md border bg-muted/40 p-2">
							<dt className="text-muted-foreground">{t("table.status")}</dt>
							<dd className="font-medium">
								{formatStatus(selectedDay.status)}
							</dd>
						</div>
						<div className="rounded-md border bg-muted/40 p-2">
							<dt className="text-muted-foreground">
								{t("editor.recommended")}
							</dt>
							<dd className="font-medium tabular-nums">
								{formatMoney(selectedDay.recommendedPrice)}
							</dd>
						</div>
						<div className="rounded-md border bg-muted/40 p-2">
							<dt className="text-muted-foreground">{t("editor.variance")}</dt>
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
								reason: String(
									formData.get("reason") ?? t("editor.defaultReason"),
								),
								roomId: activeRoomId,
							});
						}}
					>
						<label className="grid gap-2 text-sm" htmlFor="edit-price">
							<span>{t("editor.price")}</span>
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
							<span>{t("editor.reason")}</span>
							<Input
								autoComplete="off"
								defaultValue={t("editor.defaultReason")}
								id="edit-reason"
								name="reason"
								placeholder={t("editor.reasonPlaceholder")}
							/>
						</label>
						<div className="flex justify-end gap-2">
							<Button
								onClick={() => dialogRef.current?.close()}
								type="button"
								variant="outline"
							>
								{t("editor.cancel")}
							</Button>
							<Button
								disabled={
									updatePrice.isPending ||
									selectedDay.status === "closed" ||
									!canUpdate
								}
								type="submit"
							>
								{updatePrice.isPending ? t("editor.saving") : t("editor.save")}
							</Button>
						</div>
					</form>
					{!canUpdate ? (
						<p className="mt-4 text-sm text-muted-foreground">
							{t("editor.noWrite")}
						</p>
					) : null}
					{updatePrice.isError ? (
						<p className="mt-4 text-sm text-destructive" role="alert">
							{updatePrice.error.message}
						</p>
					) : null}
					{updatePrice.data ? (
						<p className="mt-4 text-sm" role="status">
							{t("editor.accepted", {
								price: formatMoney(updatePrice.data.day.price),
								status: formatStatus(updatePrice.data.day.status),
							})}
						</p>
					) : null}
				</dialog>
			) : null}

			<footer className="mt-8 text-sm text-muted-foreground">
				{t("footer.note")}{" "}
				<a
					className="underline underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
					href="/docs"
				>
					{t("footer.reference")}
				</a>
				.
			</footer>
		</main>
	);
}
