import { BaseCalendar } from "@/components/BaseCalendar";
import { useHotelSettingsContext } from "@/context/HotelSettingsContext";
import { usePrices } from "@/hooks/queries/usePrices";
import { useCalendar } from "@/hooks/useCalendar";
import { validateAndGetDate } from "@/utils/date";
import { Paper } from "@mantine/core";
import { useMemo, useState } from "react";
import { CalendarDayRates } from "./CalendarDayRates";

export const PricingCalendar: React.FC = () => {
	const { locale, selectedRoomId, timezone } = useHotelSettingsContext();
	const [_activeDate, setActiveDate] = useState<Date>(() => new Date());

	const { currentMonthDate, todayKey, onChangeMonthDate } = useCalendar({
		locale,
		timezone: timezone || undefined,
		onChangeMonthDate: (date) => setActiveDate(validateAndGetDate(date)),
	});

	const { data: priceList, isLoading } = usePrices({
		locale,
		selectedRoomId,
		currentMonthDate,
		timezone: timezone || undefined,
	});

	const dayDataMap = useMemo(
		() =>
			Object.fromEntries(
				priceList?.map((item) => [item.dayNumber, item]) || [],
			),
		[priceList],
	);

	return (
		<Paper radius="md" p="md" withBorder={true}>
			<BaseCalendar
				isLoading={isLoading}
				todayKey={todayKey}
				onChangeMonthDate={onChangeMonthDate}
				renderDay={(_, dayNumber, isCurrentMonth, isToday) => {
					const dayData = isCurrentMonth ? dayDataMap[dayNumber] || null : null;

					return (
						<CalendarDayRates
							dayData={dayData}
							isCurrentMonth={isCurrentMonth}
							isToday={isToday}
						/>
					);
				}}
			/>
		</Paper>
	);
};
