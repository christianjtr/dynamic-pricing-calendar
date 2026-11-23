import type { DayPrice } from "@hpc/contracts";
import { DayIndicators, getDayIndicators } from "./DayIndicators";
import { formatDateLabel } from "./dateRange";
import { formatCurrency, formatStatus } from "./format";

export interface DayCellProps {
	date: string;
	roomId: string;
	day?: DayPrice;
	selected: boolean;
	onSelect: (day: DayPrice) => void;
}

export function DayCell({
	date,
	roomId,
	day,
	selected,
	onSelect,
}: DayCellProps) {
	const indicators = day ? getDayIndicators(day) : [];
	const label = day
		? [
				roomId,
				date,
				formatStatus(day.status),
				formatCurrency(day.price, day.currency),
				...indicators.map((indicator) => indicator.label),
			].join(", ")
		: `${roomId}, ${date}, no data`;

	return (
		<td>
			<button
				aria-label={label}
				aria-pressed={selected}
				className="hpc-matrix-cell"
				data-status={day?.status ?? "missing"}
				disabled={!day}
				onClick={() => day && onSelect(day)}
				type="button"
			>
				<span className="hpc-day-label">{formatDateLabel(date)}</span>
				<span className="hpc-day-price">
					{day ? formatCurrency(day.price, day.currency) : "No data"}
				</span>
				<span className="hpc-day-status">
					{day ? formatStatus(day.status) : "No data"}
				</span>
				{day ? <DayIndicators compact day={day} /> : null}
			</button>
		</td>
	);
}
