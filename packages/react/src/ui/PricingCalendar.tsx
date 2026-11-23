import {
	Alert,
	Button,
	Group,
	Loader,
	Paper,
	Select,
	Text,
	Title,
} from "@mantine/core";
import { useMemo, useState } from "react";
import type { UsePricingCalendarOptions } from "../headless";
import { getDayByDate, getRoomDays, usePricingCalendar } from "../headless";
import { buildDateRange } from "./dateRange";
import { EditPanel } from "./EditPanel";
import { RoomDateMatrix } from "./RoomDateMatrix";

export interface PricingCalendarProps extends UsePricingCalendarOptions {
	title?: string;
}

export function PricingCalendar({
	from,
	to,
	rooms: requestedRooms,
	roomId,
	title = "Pricing calendar",
}: PricingCalendarProps) {
	const {
		settings,
		prices,
		rooms,
		activeRoomId,
		setSelectedRoomId,
		updatePrice,
	} = usePricingCalendar({ from, to, rooms: requestedRooms, roomId });
	const [selection, setSelection] = useState<{
		roomId: string;
		date: string;
	} | null>(null);
	const dates = useMemo(() => buildDateRange(from, to), [from, to]);
	const selectedDay = selection
		? getDayByDate(getRoomDays(prices.data, selection.roomId), selection.date)
		: undefined;

	if (settings.isPending || prices.isPending) {
		return (
			<Paper className="hpc-shell" p="xl" withBorder>
				<Group>
					<Loader aria-label="Loading pricing calendar" size="sm" />
					<Text>Loading pricing data…</Text>
				</Group>
			</Paper>
		);
	}

	const error = settings.error ?? prices.error;
	if (error) {
		return (
			<Alert color="red" title="Unable to load pricing data">
				{error.message}
				<Button
					mt="sm"
					onClick={() => {
						void settings.refetch();
						void prices.refetch();
					}}
					size="xs"
				>
					Retry
				</Button>
			</Alert>
		);
	}

	return (
		<div className="hpc-root">
			<Group justify="space-between" mb="md" wrap="wrap">
				<Title order={3}>{title}</Title>
				<Select
					allowDeselect={false}
					data={rooms.map((room) => ({ value: room.id, label: room.name }))}
					label="Active room"
					onChange={(value) => value && setSelectedRoomId(value)}
					value={activeRoomId}
				/>
			</Group>
			<RoomDateMatrix
				dates={dates}
				onSelect={(day) => {
					updatePrice.reset();
					setSelection({ roomId: day.roomId, date: day.date });
					setSelectedRoomId(day.roomId);
				}}
				prices={prices.data}
				rooms={rooms}
				selected={selection}
			/>
			{selectedDay ? (
				<EditPanel
					day={selectedDay}
					key={`${selectedDay.roomId}-${selectedDay.date}`}
					mutation={updatePrice}
					onClose={() => {
						updatePrice.reset();
						setSelection(null);
					}}
				/>
			) : null}
		</div>
	);
}
