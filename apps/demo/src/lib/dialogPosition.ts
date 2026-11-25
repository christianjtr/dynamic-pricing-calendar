export interface Bounds {
	left: number;
	top: number;
	right: number;
	bottom: number;
	width: number;
	height: number;
}

const clamp = (value: number, min: number, max: number) =>
	Math.min(Math.max(value, min), max);

export function anchoredPosition(
	anchor: Bounds,
	panel: Pick<Bounds, "width" | "height">,
	viewport: Pick<Bounds, "width" | "height">,
): Pick<Bounds, "left" | "top" | "width"> {
	const margin = 12;
	const width = Math.min(panel.width, viewport.width - margin * 2);
	const left = clamp(anchor.left, margin, viewport.width - width - margin);
	const below = anchor.bottom + 8;
	const above = anchor.top - panel.height - 8;
	const top =
		below + panel.height <= viewport.height - margin
			? below
			: clamp(
					above,
					margin,
					Math.max(margin, viewport.height - panel.height - margin),
				);

	return { left, top, width };
}
