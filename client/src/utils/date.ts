import {
	addDays,
	eachDayOfInterval,
	endOfMonth,
	endOfWeek,
	format,
	getDate,
	getMonth,
	getYear,
	parseISO,
	startOfMonth,
	startOfWeek,
} from "date-fns";

interface DateMetadata {
	dayNumber: number;
	monthIndex: number;
	yearNumber: number;
}

export function generateGridKeysWithStartOffset(
	date: Date,
	dateFormat = "yyyy-MM-dd",
): string[] {
	const firstDay = startOfMonth(date);
	const lastDay = endOfMonth(date);
	const gridStart = startOfWeek(firstDay, { weekStartsOn: 1 });
	const gridEnd = endOfWeek(lastDay, { weekStartsOn: 1 });
	const allDaysInGrid = eachDayOfInterval({ start: gridStart, end: gridEnd });

	return allDaysInGrid.map((day) => format(day, dateFormat));
}

export function getMonthLabel(date: Date, localeStr?: string): string {
	const formatter = new Intl.DateTimeFormat(localeStr || "en-US", {
		month: "long",
		year: "numeric",
	});
	return formatter.format(date);
}

export function getWeekDaysLabels(localeStr?: string): string[] {
	const baseMonday = startOfWeek(new Date(), { weekStartsOn: 1 });
	const formatter = new Intl.DateTimeFormat(localeStr || "en-US", {
		weekday: "short",
	});

	return Array.from({ length: 7 }).map((_, index) => {
		const currentDay = addDays(baseMonday, index);
		return formatter.format(currentDay);
	});
}

export function getTodayKey(dateFormat = "yyyy-MM-dd"): string {
	return format(new Date(), dateFormat);
}

export function getDateMetadata(dateKey: string): DateMetadata {
	const parsedDate = parseISO(dateKey);

	return {
		dayNumber: getDate(parsedDate),
		monthIndex: getMonth(parsedDate),
		yearNumber: getYear(parsedDate),
	};
}

export const getBrowserTimezone = (): string => {
	const browserTimezone =
		typeof Intl !== "undefined"
			? Intl.DateTimeFormat().resolvedOptions().timeZone
			: "UTC";

	return browserTimezone;
};

export function getYearMonthKey(date: Date, dateFormat = "yyyy-MM"): string {
	return format(date, dateFormat);
}

export function validateAndGetDate(date: unknown): Date {
	const isValid = date instanceof Date && !Number.isNaN(date.getTime());
	return isValid ? date : new Date();
}

export function isSameMonthAndYear(dateKey: string, targetDate: Date): boolean {
	const { monthIndex, yearNumber } = getDateMetadata(dateKey);

	const isMatchingMonth = monthIndex === targetDate.getMonth();
	const isMatchingYear = yearNumber === targetDate.getFullYear();

	return isMatchingMonth && isMatchingYear;
}
