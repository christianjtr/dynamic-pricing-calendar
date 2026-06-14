import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useCalendar } from "./useCalendar";

describe("useCalendar", () => {
	it("should initialize with the current date", () => {
		const { result } = renderHook(() => useCalendar());
		expect(result.current.currentMonthDate).toBeInstanceOf(Date);
		expect(result.current.monthLabel).toBeTypeOf("string");
		expect(result.current.dateKeys.length).toBeGreaterThan(27);
		expect(result.current.weekDays.length).toBe(7);
	});

	it("should navigate to the next month", () => {
		const { result } = renderHook(() => useCalendar());
		const initialMonth = result.current.currentMonthDate.getMonth();

		act(() => {
			result.current.handleNextMonth();
		});

		expect(result.current.currentMonthDate.getMonth()).toBe(
			(initialMonth + 1) % 12,
		);
	});

	it("should navigate to the previous month", () => {
		const { result } = renderHook(() => useCalendar());
		const initialMonth = result.current.currentMonthDate.getMonth();

		act(() => {
			result.current.handlePreviousMonth();
		});

		expect(result.current.currentMonthDate.getMonth()).toBe(
			(initialMonth - 1 + 12) % 12,
		);
	});

	it("should reset to today", () => {
		const { result } = renderHook(() => useCalendar());

		act(() => {
			result.current.handleNextMonth();
		});

		act(() => {
			result.current.handleTodayMonth();
		});

		const today = new Date();
		expect(result.current.currentMonthDate.getFullYear()).toBe(
			today.getFullYear(),
		);
		expect(result.current.currentMonthDate.getMonth()).toBe(today.getMonth());
	});

	it("should call onChangeMonthDate callback on navigation", () => {
		const onChange = vi.fn();
		const { result } = renderHook(() =>
			useCalendar({ onChangeMonthDate: onChange }),
		);

		act(() => {
			result.current.handleNextMonth();
		});

		expect(onChange).toHaveBeenCalledTimes(1);
		expect(onChange?.mock?.calls?.[0]?.[0]).toBeInstanceOf(Date);
	});
});
