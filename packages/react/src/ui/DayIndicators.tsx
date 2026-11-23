import type { DayPrice } from "@hpc/contracts";
import { formatAvailability, formatPercent } from "./format";

export interface DayIndicator {
	label: string;
	tone: "default" | "accent" | "danger";
}

export function getDayIndicators(day: DayPrice): DayIndicator[] {
	const indicators: DayIndicator[] = [];

	if (day.status === "closed" || day.isClosed) {
		indicators.push({ label: "Closed date", tone: "danger" });
	}
	if (day.status === "manual") {
		indicators.push({ label: "Manual price", tone: "accent" });
	}
	if (day.availability !== "available" && day.status !== "closed") {
		indicators.push({
			label: `Availability: ${formatAvailability(day.availability)}`,
			tone: "default",
		});
	}
	for (const restriction of day.restrictions) {
		indicators.push({ label: `Restricted: ${restriction}`, tone: "default" });
	}
	if (day.occupancy !== null) {
		indicators.push({
			label: `Occupancy: ${formatPercent(day.occupancy)}`,
			tone: "default",
		});
	}
	if (day.error) {
		indicators.push({ label: `Error: ${day.error.message}`, tone: "danger" });
	}
	if (day.variance) {
		indicators.push({
			label: `Variance: ${day.variance.label}`,
			tone: "default",
		});
	}

	return indicators;
}

export interface DayIndicatorsProps {
	day: DayPrice;
	compact?: boolean;
}

export function DayIndicators({ day, compact = false }: DayIndicatorsProps) {
	const indicators = getDayIndicators(day);
	if (indicators.length === 0) {
		return null;
	}

	return (
		<span
			className={
				compact ? "hpc-indicators hpc-indicators-compact" : "hpc-indicators"
			}
		>
			{indicators.map((indicator) => (
				<span
					className={`hpc-indicator hpc-indicator-${indicator.tone}`}
					key={`${indicator.tone}-${indicator.label}`}
				>
					{indicator.label}
				</span>
			))}
		</span>
	);
}
