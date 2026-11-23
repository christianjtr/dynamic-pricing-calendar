import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { HotelSettings } from "@/types/HotelSettings";
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

	it("should throw a descriptive error on HTTP error", async () => {
		(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
			ok: false,
			status: 500,
		});

		await expect(getSettings()).rejects.toThrow(
			"HTTP 500: Failed to fetch hotel settings",
		);
	});

	it("should throw a validation error on invalid payload", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
			ok: true,
			json: async () => ({ invalid: "data" }),
		});

		await expect(getSettings()).rejects.toThrow(
			"Invalid hotel settings data received from server",
		);
		expect(consoleSpy).toHaveBeenCalled();
		consoleSpy.mockRestore();
	});

	it("should rethrow AbortError without logging", async () => {
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
		const abortError = new DOMException("Aborted", "AbortError");
		(global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
			abortError,
		);

		await expect(getSettings()).rejects.toBe(abortError);
		expect(consoleSpy).not.toHaveBeenCalled();
		consoleSpy.mockRestore();
	});
});
