import { useHotelSettingsContext } from "@/context/HotelSettingsContext";
import { useCalendar } from "@/hooks/useCalendar";
import { getDateMetadata } from "@/utils/date";
import {
	ActionIcon,
	Box,
	Button,
	Group,
	Paper,
	SimpleGrid,
	Stack,
	Text,
	Title,
	Tooltip,
} from "@mantine/core";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { CalendarCell } from "./components/CalendarCell";
import { CalendarLoadingOverlay } from "./components/CalendarLoadingOverlay";

interface BaseCalendarProps {
	isLoading?: boolean;
	onChangeMonthDate?: (date: Date) => void;
	renderDay?: (
		dateKey: string,
		dayNumber: number,
		isCurrentMonth: boolean,
		isToday: boolean,
	) => React.ReactNode;
}

interface MobileDayRowProps {
	dateKey: string;
	activeMonth: number;
	todayKey: string;
	renderDay: BaseCalendarProps["renderDay"];
}

const MobileDayRow: React.FC<MobileDayRowProps> = ({
	dateKey,
	activeMonth,
	todayKey,
	renderDay,
}) => {
	const { dayNumber, monthIndex } = getDateMetadata(dateKey);

	if (monthIndex !== activeMonth) return null;

	const isToday = dateKey === todayKey;

	return (
		<Paper p="sm" radius="sm" withBorder bg={isToday ? "indigo.0" : "white"}>
			<Group justify="space-between" wrap="nowrap" align="center">
				<Stack gap={0} align="center" style={{ minWidth: "45px" }}>
					<Text size="xl" fw={800} c={isToday ? "indigo.6" : "gray.8"}>
						{dayNumber}
					</Text>
					{isToday && (
						<Text size="9px" fw={800} c="indigo.6">
							TODAY
						</Text>
					)}
				</Stack>
				<Box style={{ flex: 1 }}>
					{renderDay?.(dateKey, dayNumber, true, isToday)}
				</Box>
			</Group>
		</Paper>
	);
};

export const BaseCalendar: React.FC<BaseCalendarProps> = (props) => {
	const { isLoading = false, renderDay, onChangeMonthDate } = props;
	const { locale } = useHotelSettingsContext();

	const {
		currentMonthDate,
		monthLabel,
		dateKeys,
		todayKey,
		weekDays,
		handlePreviousMonth,
		handleNextMonth,
		handleTodayMonth,
	} = useCalendar({ locale, onChangeMonthDate });

	const activeMonth = currentMonthDate.getMonth();

	return (
		<Box pos="relative" style={{ width: "100%" }}>
			<CalendarLoadingOverlay isLoading={isLoading} />

			{/* CONTROLES DE NAVEGACIÓN */}
			<Group justify="space-between" mb="xl" wrap="nowrap">
				<Title order={3} fw={700}>
					{monthLabel}
				</Title>
				<Group gap="md">
					<Text size="xs" c="dimmed" fw={600} visibleFrom="sm">
						NAVIGATE
					</Text>
					<Group gap="xs">
						<Button
							variant="outline"
							color="dark"
							size="xs"
							radius="sm"
							fw={600}
							onClick={handleTodayMonth}
							disabled={isLoading}
						>
							Today
						</Button>
						<Tooltip label="Prev. Month" position="top" withArrow>
							<ActionIcon
								variant="subtle"
								color="dark"
								size="xl"
								radius="sm"
								onClick={handlePreviousMonth}
								disabled={isLoading}
							>
								<IconChevronLeft size={28} stroke={1.5} />
							</ActionIcon>
						</Tooltip>
						<Tooltip label="Next Month" position="top" withArrow>
							<ActionIcon
								variant="subtle"
								color="dark"
								size="xl"
								radius="sm"
								onClick={handleNextMonth}
								disabled={isLoading}
							>
								<IconChevronRight size={28} stroke={1.5} />
							</ActionIcon>
						</Tooltip>
					</Group>
				</Group>
			</Group>
			<Box visibleFrom="sm">
				<SimpleGrid cols={7} spacing="xs" mb="xs" ta="center">
					{weekDays.map((day) => (
						<Text key={day} fw={700} size="sm" c="dimmed" tt="capitalize">
							{day}
						</Text>
					))}
				</SimpleGrid>
				<SimpleGrid cols={7} spacing="xs" verticalSpacing="md">
					{dateKeys.map((dateKey) => (
						<CalendarCell
							key={dateKey}
							dateKey={dateKey}
							activeMonth={activeMonth}
							todayKey={todayKey}
							renderDay={renderDay}
						/>
					))}
				</SimpleGrid>
			</Box>
			<Stack hiddenFrom="sm" gap="xs">
				{dateKeys.map((dateKey) => (
					<MobileDayRow
						key={dateKey}
						dateKey={dateKey}
						activeMonth={activeMonth}
						todayKey={todayKey}
						renderDay={renderDay}
					/>
				))}
			</Stack>
		</Box>
	);
};
