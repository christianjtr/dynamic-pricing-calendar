import type { DayPrice, PricesResponse, Room } from "@hpc/contracts";
import { Badge, Box, Group, Text } from "@mantine/core";
import type { CSSProperties } from "react";
import { getRoomDays } from "../headless";
import { DayCell } from "./DayCell";
import { formatDateLabel } from "./dateRange";

export interface RoomDateMatrixProps {
	dates: string[];
	rooms: Room[];
	prices?: PricesResponse;
	selected?: { roomId: string; date: string } | null;
	onSelect: (day: DayPrice) => void;
}

export function RoomDateMatrix({
	dates,
	rooms,
	prices,
	selected,
	onSelect,
}: RoomDateMatrixProps) {
	const columnsStyle = {
		"--hpc-day-count": String(dates.length),
	} as CSSProperties;

	return (
		<Box className="hpc-scroll">
			<table
				aria-label="Pricing calendar"
				className="hpc-matrix"
				style={columnsStyle}
			>
				<thead>
					<tr className="hpc-matrix-row">
						<th scope="col">
							<Text fw={700} size="xs">
								Room
							</Text>
						</th>
						{dates.map((date) => (
							<th key={date} scope="col">
								<Text fw={700} size="xs">
									{formatDateLabel(date)}
								</Text>
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{rooms.map((room) => {
						const days = getRoomDays(prices, room.id);
						const daysByDate = new Map(days.map((day) => [day.date, day]));
						return (
							<tr className="hpc-matrix-row" key={room.id}>
								<th scope="row">
									<Group gap="xs" wrap="nowrap">
										<Text size="sm" fw={600} truncate>
											{room.name}
										</Text>
										{room.isReference ? (
											<Badge size="xs" variant="light">
												Reference
											</Badge>
										) : null}
									</Group>
								</th>
								{dates.map((date) => (
									<DayCell
										date={date}
										day={daysByDate.get(date)}
										key={`${room.id}-${date}`}
										onSelect={onSelect}
										roomId={room.id}
										selected={
											selected?.roomId === room.id && selected.date === date
										}
									/>
								))}
							</tr>
						);
					})}
				</tbody>
			</table>
		</Box>
	);
}
