import { describe, expect, it } from "vitest";
import { parseTheme, resolveTheme } from "./theme";

describe("theme", () => {
	it("parses only supported themes", () => {
		expect(parseTheme("light")).toBe("light");
		expect(parseTheme("dark")).toBe("dark");
		expect(parseTheme("auto")).toBeNull();
		expect(parseTheme(null)).toBeNull();
	});

	it("prefers a valid stored theme over the system preference", () => {
		expect(resolveTheme("dark", true)).toBe("dark");
		expect(resolveTheme("light", false)).toBe("light");
		expect(resolveTheme("auto", true)).toBe("light");
		expect(resolveTheme(null, false)).toBe("dark");
	});
});
