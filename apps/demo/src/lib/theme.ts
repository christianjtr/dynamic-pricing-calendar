export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "pricing-calendar-theme";

export const THEME_META_COLORS: Record<Theme, string> = {
	dark: "#0b1220",
	light: "#f7f9fc",
};

export function parseTheme(value: string | null | undefined): Theme | null {
	return value === "dark" || value === "light" ? value : null;
}

export function resolveTheme(
	stored: string | null | undefined,
	prefersLight: boolean,
): Theme {
	return parseTheme(stored) ?? (prefersLight ? "light" : "dark");
}
