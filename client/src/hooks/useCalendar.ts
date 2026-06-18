import {
	generateGridKeysWithStartOffset,
	getMonthLabel,
	getTodayKey,
	getWeekDaysLabels,
} from "@/utils/date";
import { useState } from "react";

interface UseCalendarOptions {
	dateFormat?: string;
	locale?: string;
	timezone?: string;
	onChangeMonthDate?: (date: Date) => void;
}

interface UseCalendarResult {
	currentMonthDate: Date;
	monthLabel: string;
	dateKeys: string[];
	todayKey: string;
	weekDays: string[];
	onChangeMonthDate?: (date: Date) => void;
	handlePreviousMonth: () => void;
	handleNextMonth: () => void;
	handleTodayMonth: () => void;
}

export const useCalendar = (opts?: UseCalendarOptions): UseCalendarResult => {
	const { locale, timezone, onChangeMonthDate } = opts || {};

	const [currentDate, setCurrentDate] = useState(() => new Date());

	const handlePreviousMonth = () => {
		const nextDate = new Date(
			currentDate.getFullYear(),
			currentDate.getMonth() - 1,
			1,
		);
		setCurrentDate(nextDate);
		onChangeMonthDate?.(nextDate);
	};

	const handleNextMonth = () => {
		const nextDate = new Date(
			currentDate.getFullYear(),
			currentDate.getMonth() + 1,
			1,
		);
		setCurrentDate(nextDate);
		onChangeMonthDate?.(nextDate);
	};

	const handleTodayMonth = () => {
		const nextDate = new Date();
		setCurrentDate(nextDate);
		onChangeMonthDate?.(nextDate);
	};

	return {
		currentMonthDate: currentDate,
		monthLabel: getMonthLabel(currentDate, timezone, locale),
		dateKeys: generateGridKeysWithStartOffset(currentDate, timezone),
		todayKey: getTodayKey(timezone),
		weekDays: getWeekDaysLabels(timezone, locale),
		onChangeMonthDate,
		handlePreviousMonth,
		handleNextMonth,
		handleTodayMonth,
	};
};
