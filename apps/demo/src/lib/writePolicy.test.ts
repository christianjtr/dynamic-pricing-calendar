import { describe, expect, it } from "vitest";
import { canWriteDay } from "./writePolicy";

describe("write policy", () => {
	it("keeps fixture writes limited to published canonical days", () => {
		expect(canWriteDay(true, true)).toBe(true);
		expect(canWriteDay(true, false)).toBe(false);
	});

	it("lets a configured backend decide every write", () => {
		expect(canWriteDay(false, false)).toBe(true);
		expect(canWriteDay(false, true)).toBe(true);
	});
});
