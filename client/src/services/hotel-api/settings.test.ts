import type { HotelSettings } from "@/types/HotelSettings";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getSettings } from "./settings";

const mockSettings: HotelSettings = {
	hotel: { timezone: "Pacific/Auckland", locale: "en-NZ" },
	rooms: {
		reference: { id: 1001, name: "Single Room" },
		derived: { "1002": { name: "Double Room" } },
	},
};

describe("getSettings", () => {
	const originalFetch = global.fetch;

	beforeEach(() => {
		global.fetch = vi.fn();
	});

	afterEach(() => {
		global.fetch = originalFetch;
		vi.clearAllMocks();
	});

	it("should return data on successful fetch and valid schema", async () => {
		(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
			ok: true,
			json: async () => mockSettings,
		});

		const result = await getSettings();
		expect(result).toEqual(mockSettings);
		expect(global.fetch).toHaveBeenCalledWith("/api/settings", {
			signal: undefined,
		});
	});

	it("should return null on HTTP error", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
			ok: false,
			status: 500,
		});

		const result = await getSettings();
		expect(result).toBeNull();
		expect(consoleSpy).toHaveBeenCalled();
		consoleSpy.mockRestore();
	});

	it("should return null on Zod validation error", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
			ok: true,
			json: async () => ({ invalid: "data" }),
		});

		const result = await getSettings();
		expect(result).toBeNull();
		expect(consoleSpy).toHaveBeenCalled();
		consoleSpy.mockRestore();
	});

	it("should return null on AbortError without logging", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const abortError = new DOMException("Aborted", "AbortError");
		(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
			abortError,
		);

		const result = await getSettings();
		expect(result).toBeNull();
		expect(consoleSpy).not.toHaveBeenCalled();
		consoleSpy.mockRestore();
	});
});
