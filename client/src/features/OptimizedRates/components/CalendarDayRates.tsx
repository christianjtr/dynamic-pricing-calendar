import { useHotelSettingsContext } from "@/context/HotelSettingsContext";
import { BRAND_COLORS } from "@/theme";
import type { DayPriceItem } from "@/types/Pricing";
import { Badge, Flex, Group, Stack, Text, Tooltip } from "@mantine/core";
import {
	IconAlertTriangle,
	IconArrowDownRight,
	IconArrowUpRight,
	IconBrain,
	IconCalendarOff,
	IconDatabase,
} from "@tabler/icons-react";
import { computeDayRatesBusinessState } from "../services/rateComputations";

interface CalendarDayRatesProps {
	dayData: DayPriceItem | null;
	isCurrentMonth: boolean;
	isToday: boolean;
}

export const CalendarDayRates: React.FC<CalendarDayRatesProps> = (props) => {
	const { dayData, isCurrentMonth, isToday } = props;
	const { currencySymbol } = useHotelSettingsContext();

	const businessState = computeDayRatesBusinessState(dayData, isCurrentMonth);

	if (!isCurrentMonth) return null;

	if (businessState.isError) {
		return (
			<Stack
				justify="center"
				align="center"
				gap={4}
				style={{ height: "100%", width: "100%" }}
			>
				<Tooltip
					label="Click or hover to inspect calculation fault"
					position="top"
					withArrow
					radius="xs"
				>
					<span style={{ cursor: "help" }}>
						<Group gap={4} wrap="nowrap" c="red.6">
							<IconAlertTriangle size={14} color="red" />
							<Text size="xs" fw={700} style={{ fontSize: "8.5px" }}>
								{businessState.errorText}
							</Text>
						</Group>
					</span>
				</Tooltip>
			</Stack>
		);
	}

	if (!businessState.hasData) {
		return (
			<Stack
				justify="center"
				align="center"
				gap={2}
				style={{ height: "100%", width: "100%" }}
			>
				<IconCalendarOff size={14} color="gray" opacity={0.4} />
				<Text
					size="xs"
					c="gray.4"
					fw={500}
					style={{ fontSize: "8px", letterSpacing: "0.2px" }}
				>
					NO INVENTORY
				</Text>
			</Stack>
		);
	}

	const isVariancePositive = businessState.variancePercentage > 0;
	const themeColor = isVariancePositive ? "indigo" : "orange";

	const trendIcon = isVariancePositive ? (
		<IconArrowUpRight size={11} stroke={2.5} />
	) : (
		<IconArrowDownRight size={11} stroke={2.5} />
	);

	const metricRows = [
		{
			label: "SUGGESTED",
			value: businessState.rpgValue,
			icon: (
				<IconBrain
					size={12}
					color={isToday ? BRAND_COLORS.primary : "indigo"}
				/>
			),
			groupColor: isToday ? BRAND_COLORS.primary : "indigo.4",
			textColor: isToday ? BRAND_COLORS.primary : "gray.6",
			tooltipLabel: "RoomPriceGenie AI Recommendation",
			fontWeight: isToday ? 700 : 500,
		},
		{
			label: "CURRENT",
			value: businessState.pmsValue,
			icon: <IconDatabase size={11} color="gray" />,
			groupColor: "gray.5",
			textColor: "gray.5",
			tooltipLabel: "Property Management System Price",
			fontWeight: 500,
		},
	];

	return (
		<Stack justify="space-between" flex={1} gap={4} p={2} mt="md">
			{metricRows.map((row) => (
				<Flex
					key={row.label}
					justify="space-between"
					align="center"
					wrap="nowrap"
					gap={4}
				>
					<Tooltip label={row.tooltipLabel} position="top" withArrow>
						<span style={{ cursor: "help" }}>
							<Group gap={4} wrap="nowrap" c={row.groupColor}>
								{row.icon}
								<Text size="xs" fw={500} style={{ fontSize: "8.5px" }}>
									{row.label}
								</Text>
							</Group>
						</span>
					</Tooltip>
					<Text size="xs" fw={row.fontWeight} c={row.textColor} ta="right">
						{currencySymbol}
						{row.value}
					</Text>
				</Flex>
			))}

			<Group
				justify="right"
				style={{
					visibility: businessState.hasHighDisparity ? "visible" : "hidden",
					height: "16px",
				}}
			>
				<Badge
					size="xs"
					radius="sm"
					variant="light"
					color={themeColor}
					leftSection={trendIcon}
					style={{ fontSize: "8.5px", fontWeight: 600 }}
				>
					{isVariancePositive ? "+" : ""}
					{Math.round(businessState.variancePercentage)}%
				</Badge>
			</Group>
		</Stack>
	);
};
