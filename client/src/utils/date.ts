import {
	addDays,
	eachDayOfInterval,
	endOfMonth,
	endOfWeek,
	getDate,
	getMonth,
	getYear,
	parseISO,
	startOfMonth,
	startOfWeek,
} from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

interface DateMetadata {
	dayNumber: number;
	monthIndex: number;
	yearNumber: number;
}

export function generateGridKeysWithStartOffset(
	date: Date,
	timezone: string = getBrowserTimezone(),
	dateFormat = "yyyy-MM-dd",
): string[] {
	const zonedDate = fromZonedTime(date, timezone);
	const firstDay = startOfMonth(zonedDate);
	const lastDay = endOfMonth(zonedDate);
	const gridStart = startOfWeek(firstDay, { weekStartsOn: 1 });
	const gridEnd = endOfWeek(lastDay, { weekStartsOn: 1 });
	const allDaysInGrid = eachDayOfInterval({ start: gridStart, end: gridEnd });

	return allDaysInGrid.map((day) =>
		formatInTimeZone(day, timezone, dateFormat),
	);
}

export function getMonthLabel(
	date: Date,
	timezone: string = getBrowserTimezone(),
	localeStr?: string,
): string {
	const zonedDate = fromZonedTime(date, timezone);
	const formatter = new Intl.DateTimeFormat(localeStr || "en-US", {
		month: "long",
		year: "numeric",
		timeZone: timezone,
	});
	return formatter.format(zonedDate);
}

export function getWeekDaysLabels(
	timezone: string = getBrowserTimezone(),
	localeStr?: string,
): string[] {
	const baseMonday = fromZonedTime(new Date(), timezone);
	const formatter = new Intl.DateTimeFormat(localeStr || "en-US", {
		weekday: "short",
		timeZone: timezone,
	});

	return Array.from({ length: 7 }).map((_, index) => {
		const currentDay = addDays(baseMonday, index);
		return formatter.format(currentDay);
	});
}

export function getTodayKey(
	timezone: string = getBrowserTimezone(),
	dateFormat = "yyyy-MM-dd",
): string {
	const today = fromZonedTime(new Date(), timezone);
	return formatInTimeZone(today, timezone, dateFormat);
}

export function getDateMetadata(
	dateKey: string,
	timezone: string = getBrowserTimezone(),
): DateMetadata {
	const parsedDate = parseISO(dateKey);
	const zonedDate = fromZonedTime(parsedDate, timezone);

	return {
		dayNumber: getDate(zonedDate),
		monthIndex: getMonth(zonedDate),
		yearNumber: getYear(zonedDate),
	};
}

export const getBrowserTimezone = (): string => {
	const browserTimezone =
		typeof Intl !== "undefined"
			? Intl.DateTimeFormat().resolvedOptions().timeZone
			: "UTC";

	return browserTimezone;
};

export function getYearMonthKey(
	date: Date,
	timezone: string = getBrowserTimezone(),
	dateFormat = "yyyy-MM",
): string {
	const zonedDate = fromZonedTime(date, timezone);
	return formatInTimeZone(zonedDate, timezone, dateFormat);
}

export function validateAndGetDate(date: unknown): Date {
	const isValid = date instanceof Date && !Number.isNaN(date.getTime());
	return isValid ? date : new Date();
}

export function isSameMonthAndYear(
	dateKey: string,
	targetDate: Date,
	timezone: string = getBrowserTimezone(),
): boolean {
	const { monthIndex, yearNumber } = getDateMetadata(dateKey, timezone);

	const zonedTarget = fromZonedTime(targetDate, timezone);
	const isMatchingMonth = monthIndex === getMonth(zonedTarget);
	const isMatchingYear = yearNumber === getYear(zonedTarget);

	return isMatchingMonth && isMatchingYear;
}
