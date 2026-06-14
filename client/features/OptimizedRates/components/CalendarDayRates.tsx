import { Badge, Flex, Group, Stack, Text, Tooltip } from "@mantine/core";
import {
	IconAlertTriangle,
	IconArrowDownRight,
	IconArrowUpRight,
	IconBrain,
	IconCalendarOff,
	IconDatabase,
} from "@tabler/icons-react";
import { useHotelSettingsContext } from "../../../context/HotelSettingsContext";
import { BRAND_COLORS } from "../../../theme";
import type { DayPriceItem } from "../../../types/Pricing";
import { computeDayRatesBusinessState } from "../services/rateComputations";

interface CalendarDayRatesProps {
	dayData: DayPriceItem | null;
	isCurrentMonth: boolean;
	isToday: boolean;
}

export const CalendarDayRates: React.FC<CalendarDayRatesProps> = (props) => {
	const { dayData, isCurrentMonth, isToday } = props;

	const { currencySymbol } = useHotelSettingsContext();

	const biz = computeDayRatesBusinessState(dayData, isCurrentMonth);

	if (!isCurrentMonth) return null;

	if (biz.isError) {
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
								{biz.errorText}
							</Text>
						</Group>
					</span>
				</Tooltip>
			</Stack>
		);
	}

	if (!biz.hasData) {
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

	const isPos = biz.variancePercentage > 0;
	const themeColor = isPos ? "indigo" : "orange";

	const trendIcon = isPos ? (
		<IconArrowUpRight size={11} stroke={2.5} />
	) : (
		<IconArrowDownRight size={11} stroke={2.5} />
	);

	return (
		<Stack justify="space-between" flex={1} gap={4} p={2} mt="md">
			<Flex justify="space-between" align="center">
				<Tooltip
					label="RoomPriceGenie AI Recommendation"
					position="top"
					withArrow
				>
					<span style={{ cursor: "help" }}>
						<Group
							gap={4}
							wrap="nowrap"
							c={isToday ? BRAND_COLORS.primary : "indigo.4"}
						>
							<IconBrain
								size={12}
								color={isToday ? BRAND_COLORS.primary : "indigo"}
							/>
							<Text size="xs" fw={500} style={{ fontSize: "8.5px" }}>
								SUGGESTED
							</Text>
						</Group>
					</span>
				</Tooltip>
				<Text
					size="xs"
					fw={isToday ? 700 : 500}
					c={isToday ? BRAND_COLORS.primary : "gray.6"}
				>
					{currencySymbol}
					{biz.rpgValue}
				</Text>
			</Flex>

			<Flex justify="space-between" align="center">
				<Tooltip
					label="Property Management System Price"
					position="top"
					withArrow
				>
					<span style={{ cursor: "help" }}>
						<Group gap={4} wrap="nowrap" c="gray.5">
							<IconDatabase size={11} color="gray" />
							<Text size="xs" fw={500} style={{ fontSize: "8.5px" }}>
								CURRENT
							</Text>
						</Group>
					</span>
				</Tooltip>
				<Text size="xs" fw={500} c="gray.5">
					{currencySymbol}
					{biz.pmsValue}
				</Text>
			</Flex>

			<Group
				justify="right"
				style={{
					visibility: biz.hasHighDisparity ? "visible" : "hidden",
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
					{isPos ? "+" : ""}
					{Math.round(biz.variancePercentage)}%
				</Badge>
			</Group>
		</Stack>
	);
};
