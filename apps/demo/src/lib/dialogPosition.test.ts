import { describe, expect, it } from "vitest";
import { anchoredPosition } from "./dialogPosition";

const panel = { width: 384, height: 260 };
const viewport = { width: 1000, height: 800 };

describe("anchored dialog position", () => {
	it("places the panel below the day", () => {
		const anchor = {
			left: 500,
			top: 300,
			right: 540,
			bottom: 330,
			width: 40,
			height: 30,
		};
		expect(anchoredPosition(anchor, panel, viewport)).toEqual({
			left: 500,
			top: 338,
			width: 384,
		});
	});

	it("keeps the panel inside the viewport", () => {
		const anchor = {
			left: 900,
			top: 300,
			right: 940,
			bottom: 330,
			width: 40,
			height: 30,
		};
		expect(anchoredPosition(anchor, panel, viewport)).toEqual({
			left: 604,
			top: 338,
			width: 384,
		});
	});

	it("flips above a day near the bottom", () => {
		const anchor = {
			left: 100,
			top: 600,
			right: 140,
			bottom: 630,
			width: 40,
			height: 30,
		};
		expect(anchoredPosition(anchor, panel, viewport)).toEqual({
			left: 100,
			top: 332,
			width: 384,
		});
	});
});
