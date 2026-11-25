import { describe, expect, it } from "vitest";
import { readEdit, readSelection, selectionHref } from "./selectionUrl";

const location = { pathname: "/", search: "", hash: "" };

describe("selection URL", () => {
	it("reads and writes the selected room and date", () => {
		const href = selectionHref(location, {
			roomId: "1002",
			date: "2026-11-23",
		});
		expect(href).toBe("/?room=1002&date=2026-11-23");
		expect(readSelection(new URL(href, "https://example.com").search)).toEqual({
			roomId: "1002",
			date: "2026-11-23",
		});
	});

	it("preserves unrelated query parameters and the hash", () => {
		expect(
			selectionHref(
				{ pathname: "/", search: "?theme=light", hash: "#calendar" },
				{ roomId: "1001", date: null },
			),
		).toBe("/?theme=light&room=1001#calendar");
	});

	it("removes cleared selection values", () => {
		const href = selectionHref(
			{ pathname: "/", search: "?room=1001&date=2026-11-23", hash: "" },
			{ roomId: null, date: null },
		);
		expect(href).toBe("/");
	});

	it("reads and writes the edit deep link", () => {
		expect(readEdit("?edit=1")).toBe(true);
		expect(readEdit("?edit=0")).toBe(false);
		expect(
			selectionHref(location, {
				roomId: "1001",
				date: "2026-11-23",
				edit: true,
			}),
		).toBe("/?room=1001&date=2026-11-23&edit=1");
		expect(
			selectionHref(
				{ pathname: "/", search: "?edit=1", hash: "" },
				{ roomId: "1001", date: null, edit: false },
			),
		).toBe("/?room=1001");
	});
});
