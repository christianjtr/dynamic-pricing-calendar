import { MantineProvider } from "@mantine/core";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BaseCalendar } from "./index";

vi.mock("@/context/HotelSettingsContext", () => ({
	useHotelSettingsContext: () => ({
		locale: "en-US",
		activeRoomName: "Single Room",
		selectedRoomId: "1001",
		timezone: "Pacific/Auckland",
		currencySymbol: "$",
		currencyCode: "USD",
		roomSelectOptions: [{ value: "1001", label: "Single Room" }],
		handleLocaleChange: vi.fn(),
		setTimezone: vi.fn(),
		setSelectedRoomId: vi.fn(),
	}),
}));

vi.mock("@/hooks/useCalendar", () => ({
	useCalendar: () => ({
		currentMonthDate: new Date("2025-01-01"),
		monthLabel: "January 2025",
		dateKeys: ["2025-01-01", "2025-01-02"],
		todayKey: "2025-01-15",
		weekDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
		handlePreviousMonth: vi.fn(),
		handleNextMonth: vi.fn(),
		handleTodayMonth: vi.fn(),
	}),
}));

describe("BaseCalendar", () => {
	const renderWithMantine = (ui: React.ReactNode) =>
		render(<MantineProvider>{ui}</MantineProvider>);

	it("renders the month label and weekday headers", () => {
		renderWithMantine(<BaseCalendar />);

		expect(screen.getByText("January 2025")).toBeTruthy();
		expect(screen.getByText("Mon")).toBeTruthy();
		expect(screen.getByText("Sun")).toBeTruthy();
	});

	it("renders navigation buttons", () => {
		renderWithMantine(<BaseCalendar />);

		expect(screen.getByText("Today")).toBeTruthy();
		expect(screen.getAllByRole("button").length).toBeGreaterThan(2);
	});
});
