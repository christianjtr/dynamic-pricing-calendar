import { BRAND_COLORS } from "@/theme";
import { getDateMetadata } from "@/utils/date";
import { Card, Flex, Text, rem } from "@mantine/core";

interface CalendarCellProps {
	dateKey: string;
	activeMonth: number;
	todayKey: string;
	renderDay?: (
		dateKey: string,
		dayNumber: number,
		isCurrentMonth: boolean,
		isToday: boolean,
	) => React.ReactNode;
}

export const CalendarCell: React.FC<CalendarCellProps> = (props) => {
	const { dateKey, activeMonth, todayKey, renderDay } = props;

	const { dayNumber, monthIndex } = getDateMetadata(dateKey);
	const isCurrentMonth = monthIndex === activeMonth;
	const isToday = dateKey === todayKey;

	const cellBg = isCurrentMonth ? undefined : "gray.0";

	const textColor = isToday
		? BRAND_COLORS.primary
		: isCurrentMonth
			? "dimmed"
			: "gray.4";

	const cardStyle = isToday
		? { borderColor: BRAND_COLORS.primary, borderWidth: rem(2) }
		: undefined;

	return (
		<Card
			withBorder
			padding="xs"
			radius="sm"
			h={120}
			bg={cellBg}
			style={cardStyle}
		>
			<Text size="sm" fw={isToday ? 800 : 600} c={textColor} ta="left">
				{dayNumber} {isToday && "•"}
			</Text>

			<Flex direction="column" flex={1}>
				{renderDay?.(dateKey, dayNumber, isCurrentMonth, isToday)}
			</Flex>
		</Card>
	);
};
