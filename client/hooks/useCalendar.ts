import { useState } from "react";
import {
	generateGridKeysWithStartOffset,
	getMonthLabel,
	getTodayKey,
	getWeekDaysLabels,
} from "../utils/date";

interface UseCalendarOptions {
	dateFormat?: string;
	locale?: string;
	onChangeMonthDate?: (date: Date) => void;
}

interface UseCalendarResult {
	currentMonthDate: Date;
	monthLabel: string;
	dateKeys: string[];
	todayKey: string;
	weekDays: string[];
	handlePreviousMonth: () => void;
	handleNextMonth: () => void;
	handleTodayMonth: () => void;
}

export const useCalendar = (opts?: UseCalendarOptions): UseCalendarResult => {
	const { locale, onChangeMonthDate } = opts || {};

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
		monthLabel: getMonthLabel(currentDate, locale),
		dateKeys: generateGridKeysWithStartOffset(currentDate),
		todayKey: getTodayKey(),
		weekDays: getWeekDaysLabels(locale),
		handlePreviousMonth,
		handleNextMonth,
		handleTodayMonth,
	};
};
