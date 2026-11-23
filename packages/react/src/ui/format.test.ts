import { describe, expect, it } from "vitest";
import { formatCurrency, formatStatus } from "./format";

describe("ui formatting", () => {
	it("formats backend currency values", () => {
		expect(formatCurrency(189, "NZD")).toContain("189");
		expect(formatCurrency(null, "NZD")).toBe("—");
	});

	it("renders backend statuses without deriving meaning", () => {
		expect(formatStatus("auto")).toBe("Automated");
		expect(formatStatus("manual")).toBe("Manual");
		expect(formatStatus("custom")).toBe("custom");
	});
});
